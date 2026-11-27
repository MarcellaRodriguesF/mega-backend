import "dotenv/config";

import { prisma } from "../src/database/prisma.js";
import { ApiError } from "../src/shared/http/api-error.js";
import { RecordStatus } from "../src/shared/enums/record-status.enum.js";
import { UnitConnectivitiesService } from "../src/modules/unit-connectivities/unit-connectivities.service.js";
import { createUnitConnectivitySchema } from "../src/modules/unit-connectivities/unit-connectivities.schemas.js";

const service = new UnitConnectivitiesService();

const results: string[] = [];

function pass(name: string) {
  results.push(`OK  ${name}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectConflict(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof ApiError, "O conflito deveria ser um ApiError.");
    assert(error.statusCode === 409, `Status esperado 409, recebido ${error.statusCode}.`);
    assert(
      error.code === "CONNECTIVITY_ALREADY_EXISTS",
      `Código esperado CONNECTIVITY_ALREADY_EXISTS, recebido ${error.code}.`,
    );
    return;
  }

  throw new Error("A operação duplicada deveria ter sido recusada.");
}

async function main() {
  const company = await prisma.company.create({
    data: { tradeName: "Empresa teste conectividade" },
  });

  const provider = await prisma.provider.create({
    data: { name: "V.tal teste conectividade" },
  });

  const [unitA, unitB] = await Promise.all([
    prisma.unit.create({
      data: {
        companyId: company.id,
        name: "Usina teste A",
        type: "SOLAR",
      },
    }),
    prisma.unit.create({
      data: {
        companyId: company.id,
        name: "Usina teste B",
        type: "SOLAR",
      },
    }),
  ]);

  try {
    const parsed = createUnitConnectivitySchema.parse({
      unitId: unitA.id,
      providerId: provider.id,
      technology: "FIBRA",
      publicIp: "200.10.0.1",
      monitoringEnabled: true,
      downloadCapacityMbps: 500,
    });

    assert(!("monitoringEnabled" in parsed), "O schema deveria ignorar monitoramento.");
    assert(
      !("downloadCapacityMbps" in parsed),
      "O schema deveria ignorar campos técnicos.",
    );
    assert(
      parsed.name === undefined,
      "O nome da conectividade não deveria ser obrigatório.",
    );
    pass("schema do cadastro básico ignora monitoramento, campos técnicos e nome");

    const created = await service.create({
      unitId: unitA.id,
      providerId: provider.id,
      name: "Conexão principal",
      technology: "FIBRA",
      publicIp: "200.10.0.1",
    });

    assert(created.status === RecordStatus.ACTIVE, "A conexão inédita deveria nascer ativa.");
    pass("criação de conexão inédita");

    await prisma.unitConnectivity.update({
      where: { id: created.id },
      data: { downloadCapacityMbps: 300 },
    });

    await service.delete(created.id);

    const inactive = await service.findById(created.id);
    assert(inactive.status === RecordStatus.INACTIVE, "A exclusão deveria inativar.");
    assert(inactive.downloadCapacityMbps === 300, "A exclusão deveria preservar o dado técnico.");

    const listedAfterDelete = await service.findByUnitId(unitA.id);
    assert(
      listedAfterDelete.every((item) => item.id !== created.id),
      "A listagem padrão não deveria mostrar o registro inativo.",
    );
    pass("exclusão lógica e filtro de listagem");

    const reactivated = await service.create({
      unitId: unitA.id,
      providerId: provider.id,
      name: "Conexão reativada",
      technology: "FIBRA",
      publicIp: "200.10.0.8",
    });

    assert(reactivated.id === created.id, "A reativação deveria preservar o id.");
    assert(
      reactivated.createdAt.getTime() === created.createdAt.getTime(),
      "A reativação deveria preservar createdAt.",
    );
    assert(reactivated.name === "Conexão reativada", "A reativação deveria atualizar o nome.");
    assert(reactivated.publicIp === "200.10.0.8", "A reativação deveria atualizar o IP.");
    assert(reactivated.status === RecordStatus.ACTIVE, "A reativação deveria voltar o status para ativo.");
    assert(
      reactivated.downloadCapacityMbps === 300,
      "A reativação deveria preservar o dado técnico existente.",
    );
    pass("reativação do registro inativo preservando id, createdAt e dado técnico");

    await service.delete(reactivated.id);

    const differentCombo = await service.create({
      unitId: unitA.id,
      providerId: provider.id,
      name: "Outra tecnologia",
      technology: "RADIO",
      publicIp: "200.10.0.20",
    });

    assert(
      differentCombo.id !== created.id,
      "Provedor ou tecnologia diferentes deveriam criar um novo registro.",
    );
    assert(differentCombo.status === RecordStatus.ACTIVE, "O novo registro deveria nascer ativo.");

    const previousCombo = await service.findById(created.id);
    assert(
      previousCombo.status === RecordStatus.INACTIVE,
      "O registro de outra tecnologia não deveria ser reativado.",
    );
    pass("criação com outra tecnologia não reativa o registro anterior");

    await service.delete(differentCombo.id);

    const restored = await service.create({
      unitId: unitA.id,
      providerId: provider.id,
      name: "Conexão reativada",
      technology: "FIBRA",
      publicIp: "200.10.0.8",
    });
    assert(restored.id === created.id, "A fibra inativa deveria ser reativada de novo.");

    await expectConflict(() =>
      service.create({
        unitId: unitA.id,
        providerId: provider.id,
        name: "Duplicada",
        technology: "FIBRA",
        publicIp: "200.10.0.9",
      }),
    );
    pass("bloqueio de duplicidade ativa");

    await expectConflict(() =>
      service.create({
        unitId: unitA.id,
        providerId: provider.id,
        name: "Enlace rádio",
        technology: "RADIO",
        publicIp: "200.10.1.1",
      }),
    );
    pass("segunda conectividade da mesma unidade é bloqueada");

    const updated = await service.update(reactivated.id, {
      technology: "RADIO",
      publicIp: "200.10.1.1",
    });
    assert(updated.id === reactivated.id, "A edição deveria atualizar o mesmo registro.");
    assert(updated.technology === "RADIO", "A edição deveria gravar a nova tecnologia.");

    const activeAfterUpdate = await service.findByUnitId(unitA.id);
    assert(activeAfterUpdate.length === 1, "A edição não deveria criar outra conectividade.");
    assert(activeAfterUpdate[0]?.id === reactivated.id, "A listagem deveria manter o registro editado.");

    await service.update(reactivated.id, {
      technology: "FIBRA",
      publicIp: "200.10.0.8",
    });
    pass("edição atualiza o registro existente");

    await service.delete(reactivated.id);

    const older = await prisma.unitConnectivity.create({
      data: {
        unitId: unitA.id,
        providerId: provider.id,
        name: "Histórico antigo",
        technology: "FIBRA",
        status: RecordStatus.INACTIVE,
        downloadCapacityMbps: 10,
      },
    });

    await prisma.$executeRaw`
      UPDATE unit_connectivities
      SET updated_at = TIMESTAMP '2020-01-01 00:00:00'
      WHERE id = CAST(${older.id} AS uuid)
    `;

    const latestReactivated = await service.create({
      unitId: unitA.id,
      providerId: provider.id,
      name: "Mais recente reativada",
      technology: "FIBRA",
      publicIp: "200.10.0.15",
    });

    assert(
      latestReactivated.id === reactivated.id,
      "Deveria reativar o inativo mais recente, não o histórico antigo.",
    );
    assert(
      latestReactivated.downloadCapacityMbps === 300,
      "O dado técnico do registro reativado deveria permanecer.",
    );

    const olderAfter = await service.findById(older.id);
    assert(olderAfter.status === RecordStatus.INACTIVE, "O histórico mais antigo deveria continuar inativo.");
    pass("reativação escolhe o inativo mais recente e mantém os demais");

    const sameCombo = Promise.allSettled([
      service.create({
        unitId: unitA.id,
        providerId: provider.id,
        name: "Simultânea 1",
        technology: "FIBRA",
        publicIp: "200.10.2.1",
      }),
      service.create({
        unitId: unitA.id,
        providerId: provider.id,
        name: "Simultânea 2",
        technology: "FIBRA",
        publicIp: "200.10.2.2",
      }),
    ]);

    const settled = await sameCombo;
    const succeeded = settled.filter((item) => item.status === "fulfilled");
    const failed = settled.filter((item) => item.status === "rejected");

    assert(succeeded.length === 0, "As duas simultâneas deveriam falhar porque a unidade já possui conectividade ativa.");
    assert(failed.length === 2, "As duas requisições simultâneas deveriam ser recusadas.");
    for (const item of failed) {
      assert(item.status === "rejected", "Resultado rejeitado.");
      assert(item.reason instanceof ApiError, "A recusa simultânea deveria ser ApiError.");
      assert(item.reason.statusCode === 409, "A recusa simultânea deveria ser HTTP 409.");
      assert(item.reason.code === "CONNECTIVITY_ALREADY_EXISTS", "Código de conflito inesperado.");
    }
    pass("duas requisições simultâneas para combinação já ativa");

    await service.delete(latestReactivated.id);

    const concurrentCreate = await Promise.allSettled([
      service.create({
        unitId: unitA.id,
        providerId: provider.id,
        name: "Corrida 1",
        technology: "FIBRA",
        publicIp: "200.10.3.1",
      }),
      service.create({
        unitId: unitA.id,
        providerId: provider.id,
        name: "Corrida 2",
        technology: "FIBRA",
        publicIp: "200.10.3.2",
      }),
    ]);

    const createdOnce = concurrentCreate.filter((item) => item.status === "fulfilled");
    const rejectedOnce = concurrentCreate.filter((item) => item.status === "rejected");

    assert(createdOnce.length === 1, "Apenas uma criação simultânea deveria vencer.");
    assert(rejectedOnce.length === 1, "A outra criação simultânea deveria receber conflito.");
    const rejection = rejectedOnce[0];
    assert(rejection?.status === "rejected", "A segunda corrida deveria falhar.");
    assert(rejection.reason instanceof ApiError, "A corrida deveria falhar com ApiError.");
    assert(rejection.reason.statusCode === 409, "A corrida deveria responder 409.");

    const activeOnUnit = await prisma.unitConnectivity.count({
      where: {
        unitId: unitA.id,
        status: RecordStatus.ACTIVE,
      },
    });
    assert(activeOnUnit === 1, `Deveria existir uma conectividade ativa, encontrado ${activeOnUnit}.`);
    pass("duas criações simultâneas da mesma unidade");

    const winner = createdOnce[0];
    assert(winner?.status === "fulfilled", "A criação vencedora deveria existir.");
    await service.delete(winner.value.id);

    const differentUnits = await Promise.all([
      service.create({
        unitId: unitA.id,
        providerId: provider.id,
        name: "Satélite A",
        technology: "SATELITE",
        publicIp: "200.10.4.1",
      }),
      service.create({
        unitId: unitB.id,
        providerId: provider.id,
        name: "Satélite B",
        technology: "SATELITE",
        publicIp: "200.10.4.2",
      }),
    ]);

    assert(differentUnits.length === 2, "Unidades diferentes deveriam cadastrar em paralelo.");
    pass("criação simultânea em unidades diferentes");

    console.log(results.join("\n"));
  } finally {
    await prisma.unitConnectivity.deleteMany({
      where: {
        unitId: {
          in: [unitA.id, unitB.id],
        },
      },
    });
    await prisma.unit.deleteMany({
      where: {
        id: {
          in: [unitA.id, unitB.id],
        },
      },
    });
    await prisma.provider.delete({ where: { id: provider.id } });
    await prisma.company.delete({ where: { id: company.id } });
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  console.log(results.join("\n"));
  await prisma.$disconnect();
  process.exit(1);
});
