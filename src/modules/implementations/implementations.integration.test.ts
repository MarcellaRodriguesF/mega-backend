import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { ImplementationsService } from "./implementations.service.js";

const suffix = `${Date.now()}`;
const service = new ImplementationsService();

const created = {
  companyId: "",
  unitWithProviderId: "",
  unitWithoutProviderId: "",
  providerId: "",
  connectivityId: "",
  formTemplateId: "",
  templateId: "",
  implementationIds: [] as string[],
};

async function removeQuietly(action: () => Promise<unknown>) {
  try {
    await action();
  } catch {
    // O registro pode não ter sido criado se o teste falhou antes.
  }
}

after(async () => {
  for (const implementationId of created.implementationIds) {
    await removeQuietly(() =>
      prisma.implementation.delete({ where: { id: implementationId } }),
    );
  }

  await removeQuietly(() =>
    prisma.template.delete({ where: { id: created.templateId } }),
  );
  await removeQuietly(() =>
    prisma.formTemplate.delete({ where: { id: created.formTemplateId } }),
  );
  await removeQuietly(() =>
    prisma.unitConnectivity.delete({ where: { id: created.connectivityId } }),
  );
  await removeQuietly(() =>
    prisma.unit.delete({ where: { id: created.unitWithProviderId } }),
  );
  await removeQuietly(() =>
    prisma.unit.delete({ where: { id: created.unitWithoutProviderId } }),
  );
  await removeQuietly(() =>
    prisma.provider.delete({ where: { id: created.providerId } }),
  );
  await removeQuietly(() =>
    prisma.company.delete({ where: { id: created.companyId } }),
  );
  await prisma.$disconnect();
});

describe("implantação persistida", () => {
  it("copia a estrutura publicada e não acompanha edições posteriores", async () => {
    const company = await prisma.company.create({
      data: { tradeName: `Cliente implantação ${suffix}` },
    });
    created.companyId = company.id;

    const provider = await prisma.provider.create({
      data: { name: `Provedor ${suffix}` },
    });
    created.providerId = provider.id;

    const unit = await prisma.unit.create({
      data: {
        companyId: company.id,
        name: `Usina ${suffix}`,
        type: "USINA",
        address: {
          create: {
            street: "Rua das Usinas",
            number: "100",
            city: "Campinas",
            state: "SP",
          },
        },
      },
    });
    created.unitWithProviderId = unit.id;

    const connectivity = await prisma.unitConnectivity.create({
      data: {
        unitId: unit.id,
        providerId: provider.id,
        technology: "FIBRA",
        publicIp: "203.0.113.10",
        gatewayIp: "203.0.113.1",
        localIp: "10.0.0.8",
        wanIp: "198.51.100.4",
        status: "ACTIVE",
      },
    });
    created.connectivityId = connectivity.id;

    const unitWithoutProvider = await prisma.unit.create({
      data: {
        companyId: company.id,
        name: `Usina sem provedor ${suffix}`,
        type: "USINA",
      },
    });
    created.unitWithoutProviderId = unitWithoutProvider.id;

    const form = await prisma.formTemplate.create({
      data: {
        name: `Formulário ${suffix}`,
        description: "Estrutura original",
        fields: {
          create: {
            key: "tecnologia",
            label: "Tecnologia original",
            type: "TEXT",
            isRequired: true,
            order: 0,
          },
        },
      },
    });
    created.formTemplateId = form.id;

    const template = await prisma.template.create({
      data: {
        name: `Template ${suffix}`,
        description: "Descrição original",
        status: "PUBLISHED",
        stages: {
          create: {
            name: "Instalação original",
            order: 0,
            activities: {
              create: {
                name: "Ativar link",
                description: "Atividade original",
                order: 0,
                requirements: {
                  create: [
                    {
                      type: "FORM",
                      isRequired: true,
                      order: 0,
                      formTemplateId: form.id,
                    },
                    {
                      type: "EVIDENCE",
                      isRequired: true,
                      order: 1,
                      evidenceTypes: {
                        create: { type: "PHOTO" },
                      },
                    },
                    {
                      type: "ENGINEER_APPROVAL",
                      isRequired: true,
                      order: 2,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });
    created.templateId = template.id;

    const draft = await prisma.template.create({
      data: {
        name: `Rascunho ${suffix}`,
        status: "DRAFT",
        stages: {
          create: {
            name: "Etapa",
            order: 0,
            activities: {
              create: {
                name: "Atividade",
                order: 0,
              },
            },
          },
        },
      },
    });

    await assert.rejects(
      () => service.create({ templateId: draft.id, unitId: unit.id }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "TEMPLATE_NOT_PUBLISHED",
    );
    await prisma.template.delete({ where: { id: draft.id } });

    const createdImplementation = await service.create({
      templateId: template.id,
      unitId: unit.id,
    });
    created.implementationIds.push(createdImplementation.id);

    assert.equal(createdImplementation.unit?.id, unit.id);
    assert.equal(createdImplementation.unit?.company.tradeName, company.tradeName);
    assert.equal(createdImplementation.unit?.activeConnectivity?.provider?.id, provider.id);
    assert.equal(createdImplementation.unit?.activeConnectivity?.publicIp, "203.0.113.10");
    assert.equal(createdImplementation.unit?.activeConnectivity?.wanIp, "198.51.100.4");
    assert.equal(createdImplementation.connectivityEditable, false);
    assert.equal(createdImplementation.capturedUnit.initialProvider?.name, provider.name);
    assert.equal(createdImplementation.stages[0]?.name, "Instalação original");
    assert.equal(createdImplementation.formSnapshots[0]?.fields[0]?.label, "Tecnologia original");
    assert.equal(
      createdImplementation.stages[0]?.activities[0]?.requirements[1]?.evidenceTypes[0]?.type,
      "PHOTO",
    );
    assert.equal(createdImplementation.stages[0]?.activities[0]?.assignments.length, 0);

    await prisma.template.update({
      where: { id: template.id },
      data: { name: `Template alterado ${suffix}` },
    });
    await prisma.templateStage.update({
      where: { id: createdImplementation.stages[0]!.sourceStageId! },
      data: { name: "Etapa alterada depois" },
    });
    await prisma.formField.update({
      where: { id: createdImplementation.formSnapshots[0]!.fields[0]!.sourceFormFieldId! },
      data: { label: "Tecnologia alterada depois" },
    });

    const reloaded = await service.findById(createdImplementation.id);
    assert.equal(reloaded.template.name, `Template ${suffix}`);
    assert.equal(reloaded.stages[0]?.name, "Instalação original");
    assert.equal(reloaded.formSnapshots[0]?.fields[0]?.label, "Tecnologia original");

    const storedConnectivity = await prisma.unitConnectivity.findUnique({
      where: { id: connectivity.id },
    });
    assert.equal(storedConnectivity?.technology, "FIBRA");
    assert.equal(storedConnectivity?.publicIp, "203.0.113.10");

    const withoutProvider = await service.create({
      templateId: template.id,
      unitId: unitWithoutProvider.id,
    });
    created.implementationIds.push(withoutProvider.id);

    assert.equal(withoutProvider.unit?.activeConnectivity, null);
    assert.equal(withoutProvider.capturedUnit.initialProvider, null);

    const listed = await service.findAll({
      page: 1,
      pageSize: 10,
      companyId: company.id,
      unitId: unit.id,
      status: "IN_PROGRESS",
    });

    assert.equal(listed.total, 1);
    assert.equal(listed.items[0]?.id, createdImplementation.id);
    assert.equal(listed.items[0]?.initialProvider?.name, provider.name);
  });
});
