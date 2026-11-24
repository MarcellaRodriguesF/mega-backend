import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import { RecordStatus } from "../../shared/enums/record-status.enum.js";
import type {
  CreateUnitConnectivityData,
  UnitConnectivityCombo,
  UpdateUnitConnectivityData,
} from "./unit-connectivities.types.js";

export type UnitConnectivityDb = Prisma.TransactionClient;

const connectivityInclude = {
  unit: true,
  provider: true,
} as const;

export class UnitConnectivitiesRepository {
  async lockUnit(db: UnitConnectivityDb, unitId: string) {
    const rows = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM units
      WHERE id = CAST(${unitId} AS uuid)
      FOR UPDATE
    `;

    return rows[0] ?? null;
  }

  create(db: UnitConnectivityDb, data: CreateUnitConnectivityData) {
    return db.unitConnectivity.create({
      data,
      include: connectivityInclude,
    });
  }

  findAll() {
    return prisma.unitConnectivity.findMany({
      where: {
        status: RecordStatus.ACTIVE,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        unit: {
          include: {
            company: true,
          },
        },
        provider: true,
      },
    });
  }

  findById(id: string, db: UnitConnectivityDb | typeof prisma = prisma) {
    return db.unitConnectivity.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            company: true,
          },
        },
        provider: true,
      },
    });
  }

  findUnitById(unitId: string) {
    return prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
      },
    });
  }

  findByUnitId(unitId: string) {
    return prisma.unitConnectivity.findMany({
      where: {
        unitId,
        status: RecordStatus.ACTIVE,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        provider: true,
      },
    });
  }

  findActiveByCombo(db: UnitConnectivityDb, combo: UnitConnectivityCombo) {
    return db.unitConnectivity.findFirst({
      where: {
        unitId: combo.unitId,
        providerId: combo.providerId,
        technology: combo.technology,
        status: RecordStatus.ACTIVE,
        ...(combo.excludeId
          ? {
              id: {
                not: combo.excludeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });
  }

  findLatestInactiveByCombo(
    db: UnitConnectivityDb,
    combo: Pick<UnitConnectivityCombo, "unitId" | "providerId" | "technology">,
  ) {
    return db.unitConnectivity.findFirst({
      where: {
        unitId: combo.unitId,
        providerId: combo.providerId,
        technology: combo.technology,
        status: RecordStatus.INACTIVE,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  findProviderById(
    providerId: string,
    db: UnitConnectivityDb | typeof prisma = prisma,
  ) {
    return db.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
      },
    });
  }

  update(db: UnitConnectivityDb, id: string, data: UpdateUnitConnectivityData) {
    return db.unitConnectivity.update({
      where: { id },
      data,
      include: connectivityInclude,
    });
  }

  inactivate(db: UnitConnectivityDb, id: string) {
    return db.unitConnectivity.update({
      where: { id },
      data: {
        status: RecordStatus.INACTIVE,
      },
    });
  }
}
