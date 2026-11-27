import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "../../database/prisma.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";
import { ApiError } from "../../shared/http/api-error.js";
import { ActivitiesService } from "../activities/activities.service.js";
import { ImplementationsService } from "./implementations.service.js";

const suffix = `${Date.now()}`;
const implementations = new ImplementationsService();
const activities = new ActivitiesService();

const ids = {
  companyId: "",
  otherCompanyId: "",
  unitId: "",
  unitWithoutProviderId: "",
  providerId: "",
  connectivityId: "",
  formId: "",
  templateId: "",
  draftId: "",
  archivedId: "",
  implementationIds: [] as string[],
  activityIds: [] as string[],
  profileIds: [] as string[],
  userIds: [] as string[],
};

const actors: Record<string, { id: string; accessProfileId: string }> = {};

async function quiet(action: () => Promise<unknown>) {
  try {
    await action();
  } catch {
    // limpeza
  }
}

async function grant(profileId: string, codes: string[]) {
  for (const code of codes) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code,
        module: code.startsWith("IMPLEMENTATIONS") ? "IMPLEMENTATIONS" : "ACTIVITIES",
      },
    });
    await prisma.profilePermission.upsert({
      where: {
        accessProfileId_permissionId: {
          accessProfileId: profileId,
          permissionId: permission.id,
        },
      },
      update: {},
      create: { accessProfileId: profileId, permissionId: permission.id },
    });
  }
}

async function makeUser(key: string, codes: string[]) {
  const profile = await prisma.accessProfile.create({
    data: { name: `${key} ${suffix}`, description: key },
  });
  ids.profileIds.push(profile.id);
  await grant(profile.id, codes);
  const user = await prisma.user.create({
    data: {
      email: `${key}.${suffix}@mega.local`,
      name: key,
      passwordHash: "test",
      accessProfileId: profile.id,
    },
  });
  ids.userIds.push(user.id);
  actors[key] = { id: user.id, accessProfileId: profile.id };
}

before(async () => {
  const company = await prisma.company.create({
    data: { tradeName: `Cliente ${suffix}` },
  });
  ids.companyId = company.id;
  const other = await prisma.company.create({
    data: { tradeName: `Outro ${suffix}` },
  });
  ids.otherCompanyId = other.id;
  const provider = await prisma.provider.create({ data: { name: `Provedor ${suffix}` } });
  ids.providerId = provider.id;
  const unit = await prisma.unit.create({
    data: {
      companyId: company.id,
      name: `Usina ${suffix}`,
      type: "USINA",
      address: { create: { city: "Campinas", state: "SP", street: "Rua A" } },
    },
  });
  ids.unitId = unit.id;
  const connectivity = await prisma.unitConnectivity.create({
    data: {
      unitId: unit.id,
      providerId: provider.id,
      technology: "FIBRA",
      publicIp: "203.0.113.10",
      wanIp: "198.51.100.4",
      status: "ACTIVE",
    },
  });
  ids.connectivityId = connectivity.id;
  const bare = await prisma.unit.create({
    data: { companyId: company.id, name: `Sem provedor ${suffix}`, type: "USINA" },
  });
  ids.unitWithoutProviderId = bare.id;
  const form = await prisma.formTemplate.create({
    data: {
      name: `Form ${suffix}`,
      fields: {
        create: { key: "tecnologia", label: "Tecnologia original", type: "TEXT", isRequired: true, order: 0 },
      },
    },
  });
  ids.formId = form.id;
  const template = await prisma.template.create({
    data: {
      name: `Template ${suffix}`,
      status: "PUBLISHED",
      stages: {
        create: {
          name: "Instalação original",
          order: 0,
          activities: {
            create: {
              name: "Ativar link",
              order: 0,
              requirements: {
                create: [
                  { type: "FORM", isRequired: true, order: 0, formTemplateId: form.id },
                  { type: "EVIDENCE", isRequired: true, order: 1, evidenceTypes: { create: { type: "PHOTO" } } },
                ],
              },
            },
          },
        },
      },
    },
  });
  ids.templateId = template.id;
  const draft = await prisma.template.create({
    data: {
      name: `Rascunho ${suffix}`,
      status: "DRAFT",
      stages: { create: { name: "Etapa", order: 0, activities: { create: { name: "Atividade", order: 0 } } } },
    },
  });
  ids.draftId = draft.id;
  const archived = await prisma.template.create({
    data: {
      name: `Arquivado ${suffix}`,
      status: "ARCHIVED",
      stages: { create: { name: "Etapa", order: 0, activities: { create: { name: "Atividade", order: 0 } } } },
    },
  });
  ids.archivedId = archived.id;

  await makeUser("sem-permissao", []);
  await makeUser("executor", [PERMISSIONS.ACTIVITIES_EXECUTE]);
  await makeUser("supervisor", [PERMISSIONS.ACTIVITIES_COMPLETE]);
  await makeUser("gestor", [PERMISSIONS.ACTIVITIES_MANAGE]);
  await makeUser("operacao", Object.values(PERMISSIONS));
});

after(async () => {
  const activityFilter = {
    OR: [
      { id: { in: ids.activityIds } },
      { implementationId: { in: ids.implementationIds } },
      { companyId: { in: [ids.companyId, ids.otherCompanyId] } },
      { unitId: { in: [ids.unitId, ids.unitWithoutProviderId] } },
    ],
  };
  await quiet(() => prisma.activity.deleteMany({ where: activityFilter }));
  for (const id of ids.implementationIds) {
    await quiet(() => prisma.implementation.delete({ where: { id } }));
  }
  await quiet(() => prisma.template.delete({ where: { id: ids.templateId } }));
  await quiet(() => prisma.template.delete({ where: { id: ids.draftId } }));
  await quiet(() => prisma.template.delete({ where: { id: ids.archivedId } }));
  await quiet(() => prisma.formTemplate.delete({ where: { id: ids.formId } }));
  await quiet(() => prisma.unitConnectivity.delete({ where: { id: ids.connectivityId } }));
  await quiet(() => prisma.unit.delete({ where: { id: ids.unitId } }));
  await quiet(() => prisma.unit.delete({ where: { id: ids.unitWithoutProviderId } }));
  await quiet(() => prisma.provider.delete({ where: { id: ids.providerId } }));
  for (const id of ids.userIds) await quiet(() => prisma.user.delete({ where: { id } }));
  for (const id of ids.profileIds) {
    await quiet(() => prisma.profilePermission.deleteMany({ where: { accessProfileId: id } }));
    await quiet(() => prisma.accessProfile.delete({ where: { id } }));
  }
  await quiet(() => prisma.company.delete({ where: { id: ids.companyId } }));
  await quiet(() => prisma.company.delete({ where: { id: ids.otherCompanyId } }));
  await prisma.$disconnect();
});

describe("implantações opcionais", () => {
  it("cria com template, cliente e unidade e preserva o snapshot", async () => {
    const created = await implementations.create({
      name: `Com template ${suffix}`,
      description: null,
      templateId: ids.templateId,
      companyId: null,
      unitId: ids.unitId,
    });
    ids.implementationIds.push(created.id);
    assert.equal(created.captured.companyId, ids.companyId);
    assert.equal(created.unit?.activeConnectivity?.provider?.id, ids.providerId);
    assert.equal(created.stages[0]?.name, "Instalação original");
    assert.equal(created.stages[0]?.activities[0]?.formSnapshots[0]?.fields[0]?.label, "Tecnologia original");
    assert.equal(created.directActivities.length, 0);

    await prisma.template.update({
      where: { id: ids.templateId },
      data: { name: `Alterado ${suffix}` },
    });
    await prisma.templateStage.update({
      where: { id: created.stages[0]!.sourceStageId! },
      data: { name: "Etapa alterada" },
    });
    const reloaded = await implementations.findById(created.id);
    assert.equal(reloaded.template?.name, `Template ${suffix}`);
    assert.equal(reloaded.stages[0]?.name, "Instalação original");
    const connectivity = await prisma.unitConnectivity.findUnique({ where: { id: ids.connectivityId } });
    assert.equal(connectivity?.publicIp, "203.0.113.10");
    assert.equal(connectivity?.wanIp, "198.51.100.4");
  });

  it("recusa template que não está publicado", async () => {
    await assert.rejects(
      () =>
        implementations.create({
          name: "Rascunho",
          description: null,
          templateId: ids.draftId,
          companyId: null,
          unitId: null,
        }),
      (error: unknown) => error instanceof ApiError && error.code === "TEMPLATE_NOT_PUBLISHED",
    );
    await assert.rejects(
      () =>
        implementations.create({
          name: "Arquivado",
          description: null,
          templateId: ids.archivedId,
          companyId: null,
          unitId: null,
        }),
      (error: unknown) => error instanceof ApiError && error.code === "TEMPLATE_NOT_PUBLISHED",
    );
  });

  it("cria com template sem unidade, com cliente sem unidade e sem nenhum dos dois", async () => {
    const withTemplate = await implementations.create({
      name: `Template sem unidade ${suffix}`,
      description: null,
      templateId: ids.templateId,
      companyId: ids.companyId,
      unitId: null,
    });
    const clientOnly = await implementations.create({
      name: `Só cliente ${suffix}`,
      description: null,
      templateId: null,
      companyId: ids.companyId,
      unitId: null,
    });
    const empty = await implementations.create({
      name: `Vazia ${suffix}`,
      description: "Sem template, cliente ou unidade",
      templateId: null,
      companyId: null,
      unitId: null,
    });
    ids.implementationIds.push(withTemplate.id, clientOnly.id, empty.id);
    assert.equal(withTemplate.captured.unitId, null);
    assert.equal(withTemplate.stages.length, 1);
    assert.equal(clientOnly.template, null);
    assert.equal(clientOnly.captured.companyTradeName, `Cliente ${suffix}`);
    assert.equal(clientOnly.stages.length, 0);
    assert.equal(empty.captured.companyId, null);
    assert.equal(empty.captured.unitId, null);
    assert.equal(empty.directActivities.length, 0);
  });

  it("recusa unidade de outro cliente", async () => {
    await assert.rejects(
      () =>
        implementations.create({
          name: "Conflito",
          description: null,
          templateId: null,
          companyId: ids.otherCompanyId,
          unitId: ids.unitId,
        }),
      (error: unknown) => error instanceof ApiError && error.code === "UNIT_COMPANY_MISMATCH",
    );
  });
});

describe("atividades operacionais", () => {
  it("cria atividade independente, com cliente e com unidade", async () => {
    const alone = await activities.create({
      name: `Avulsa ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    const clientOnly = await activities.create({
      name: `Cliente ${suffix}`,
      description: null,
      companyId: ids.companyId,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    const withUnit = await activities.create({
      name: `Unidade ${suffix}`,
      description: null,
      companyId: null,
      unitId: ids.unitWithoutProviderId,
      implementationId: null,
      stageId: null,
    });
    ids.activityIds.push(alone.id, clientOnly.id, withUnit.id);
    assert.equal(alone.independent, true);
    assert.equal(alone.implementationId, null);
    assert.equal(alone.stageId, null);
    assert.equal(clientOnly.companyId, ids.companyId);
    assert.equal(clientOnly.unitId, null);
    assert.equal(withUnit.companyId, ids.companyId);
    assert.equal(withUnit.initialProviderId, null);
  });

  it("cria atividade direta e dentro da etapa, e vincula uma avulsa sem duplicar", async () => {
    const implementation = await implementations.create({
      name: `Processo ${suffix}`,
      description: null,
      templateId: null,
      companyId: ids.companyId,
      unitId: ids.unitId,
    });
    ids.implementationIds.push(implementation.id);
    const stage = await implementations.createStage(implementation.id, {
      name: "Visita",
      description: null,
    });
    const direct = await activities.create({
      name: `Direta ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: implementation.id,
      stageId: null,
    });
    const inside = await activities.create({
      name: `Na etapa ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: implementation.id,
      stageId: stage.id,
    });
    const loose = await activities.create({
      name: `Para vincular ${suffix}`,
      description: "Histórico",
      companyId: null,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    ids.activityIds.push(direct.id, inside.id, loose.id);

    const snapshot = await prisma.implementationFormSnapshot.create({
      data: {
        activityId: loose.id,
        name: "Formulário da atividade",
        status: "ACTIVE",
        fields: {
          create: { key: "obs", label: "Observação", type: "TEXT", isRequired: false, order: 0 },
        },
      },
      include: { fields: true },
    });
    const requirement = await prisma.implementationRequirement.create({
      data: { activityId: loose.id, type: "EVIDENCE", isRequired: false, order: 0 },
    });
    const evidence = await prisma.activityEvidence.create({
      data: {
        activityId: loose.id,
        requirementId: requirement.id,
        evidenceType: "PHOTO",
        fileName: "foto.jpg",
        storageKey: `tests/${suffix}.jpg`,
      },
    });
    const response = await prisma.activityFieldResponse.create({
      data: {
        activityId: loose.id,
        fieldId: snapshot.fields[0]!.id,
        valueText: "valor original",
      },
    });
    await activities.assign(loose.id, { userId: actors.executor!.id, role: "EXECUTOR" });
    await activities.assign(loose.id, { userId: actors.supervisor!.id, role: "SUPERVISOR" });

    const linked = await activities.place(actors.operacao!, loose.id, {
      implementationId: implementation.id,
      stageId: stage.id,
      acknowledgeCompleted: false,
      reason: "Entrar no processo",
    });

    assert.equal(linked.id, loose.id);
    assert.equal(linked.implementationId, implementation.id);
    assert.equal(linked.stageId, stage.id);
    assert.equal(linked.assignments.length, 2);
    assert.equal(linked.formSnapshots[0]?.id, snapshot.id);
    assert.equal(linked.evidences[0]?.id, evidence.id);
    assert.equal(linked.formSnapshots[0]?.fields[0]?.responses[0]?.id, response.id);
    assert.equal(linked.formSnapshots[0]?.fields[0]?.responses[0]?.valueText, "valor original");
    assert.equal(linked.placements.length, 1);

    const detail = await implementations.findById(implementation.id);
    const idsInImplementation = [
      ...detail.directActivities.map((item) => item.id),
      ...detail.stages.flatMap((item) => item.activities.map((activity) => activity.id)),
    ];
    assert.equal(idsInImplementation.filter((item) => item === loose.id).length, 1);
    assert.ok(idsInImplementation.includes(direct.id));
    assert.ok(idsInImplementation.includes(inside.id));

    const other = await implementations.create({
      name: `Outra ${suffix}`,
      description: null,
      templateId: null,
      companyId: null,
      unitId: null,
    });
    ids.implementationIds.push(other.id);
    await assert.rejects(
      () =>
        activities.place(actors.operacao!, loose.id, {
          implementationId: other.id,
          stageId: null,
          acknowledgeCompleted: false,
          reason: null,
        }),
      (error: unknown) => error instanceof ApiError && error.code === "ACTIVITY_ALREADY_LINKED",
    );

    await assert.rejects(
      () =>
        activities.create({
          name: "Etapa errada",
          description: null,
          companyId: null,
          unitId: null,
          implementationId: other.id,
          stageId: stage.id,
        }),
      (error: unknown) => error instanceof ApiError && error.code === "STAGE_IMPLEMENTATION_MISMATCH",
    );
  });

  it("exige confirmação para mover atividade concluída", async () => {
    const activity = await activities.create({
      name: `Concluída ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    ids.activityIds.push(activity.id);
    await activities.assign(activity.id, { userId: actors.supervisor!.id, role: "SUPERVISOR" });
    await activities.complete(actors.supervisor!, activity.id);
    const implementation = await implementations.create({
      name: `Destino ${suffix}`,
      description: null,
      templateId: null,
      companyId: null,
      unitId: null,
    });
    ids.implementationIds.push(implementation.id);
    await assert.rejects(
      () =>
        activities.place(actors.operacao!, activity.id, {
          implementationId: implementation.id,
          stageId: null,
          acknowledgeCompleted: false,
          reason: null,
        }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.code === "ACTIVITY_COMPLETED_MOVE_REQUIRES_CONFIRMATION",
    );
    const moved = await activities.place(actors.operacao!, activity.id, {
      implementationId: implementation.id,
      stageId: null,
      acknowledgeCompleted: true,
      reason: "Arquivo consciente",
    });
    assert.equal(moved.id, activity.id);
    assert.equal(moved.status, "COMPLETED");
    assert.equal(moved.placements[0]?.explicitConfirmation, true);
  });
});

describe("responsáveis e permissões", () => {
  it("aceita um supervisor, vários executores e os dois papéis na mesma pessoa", async () => {
    const activity = await activities.create({
      name: `Equipe ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    ids.activityIds.push(activity.id);
    await activities.assign(activity.id, { userId: actors.supervisor!.id, role: "SUPERVISOR" });
    await activities.assign(activity.id, { userId: actors.supervisor!.id, role: "EXECUTOR" });
    await activities.assign(activity.id, { userId: actors.executor!.id, role: "EXECUTOR" });
    await assert.rejects(
      () => activities.assign(activity.id, { userId: actors.gestor!.id, role: "SUPERVISOR" }),
      (error: unknown) => error instanceof ApiError && error.code === "SUPERVISOR_ALREADY_ASSIGNED",
    );
    await assert.rejects(
      () => activities.assign(activity.id, { userId: actors.executor!.id, role: "EXECUTOR" }),
      (error: unknown) => error instanceof ApiError && error.code === "ASSIGNMENT_DUPLICATE",
    );
  });

  it("valida execução e conclusão pela permissão e pela atribuição", async () => {
    const activity = await activities.create({
      name: `Fluxo ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    ids.activityIds.push(activity.id);

    await assert.rejects(
      () => activities.start(actors.executor!, activity.id),
      (error: unknown) => error instanceof ApiError && error.code === "ACTIVITY_EXECUTE_FORBIDDEN",
    );
    await assert.rejects(
      () => activities.complete(actors.supervisor!, activity.id),
      (error: unknown) => error instanceof ApiError && error.code === "ACTIVITY_COMPLETE_FORBIDDEN",
    );

    await activities.assign(activity.id, { userId: actors.executor!.id, role: "EXECUTOR" });
    await activities.assign(activity.id, { userId: actors.supervisor!.id, role: "SUPERVISOR" });
    const started = await activities.start(actors.executor!, activity.id);
    assert.equal(started.status, "IN_PROGRESS");
    const completed = await activities.complete(actors.supervisor!, activity.id);
    assert.equal(completed.status, "COMPLETED");

    const managed = await activities.create({
      name: `Global ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    ids.activityIds.push(managed.id);
    const byManager = await activities.complete(actors.gestor!, managed.id);
    assert.equal(byManager.status, "COMPLETED");
    const byFullProfile = await activities.create({
      name: `Perfil completo ${suffix}`,
      description: null,
      companyId: null,
      unitId: null,
      implementationId: null,
      stageId: null,
    });
    ids.activityIds.push(byFullProfile.id);
    const done = await activities.start(actors.operacao!, byFullProfile.id);
    assert.equal(done.status, "IN_PROGRESS");
    assert.equal(actors.operacao!.accessProfileId.length > 0, true);
  });
});
