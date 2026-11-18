
import { prisma } from "../../database/prisma.js";
import type {
  CreateUnitConnectivityData,
  UpdateUnitConnectivityData,
} from "./unit-connectivities.types.js";

export class UnitConnectivitiesRepository {
  create(data: CreateUnitConnectivityData) {
    return prisma.unitConnectivity.create({
      data,
      include: {
        unit: true,
        provider: true,
      },
    });
  }

  findAll() {
    return prisma.unitConnectivity.findMany({
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

  findById(id: string) {
    return prisma.unitConnectivity.findUnique({
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

  findByUnitId(unitId: string) {
    return prisma.unitConnectivity.findMany({
      where: { unitId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
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

  findProviderById(providerId: string) {
    return prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
      },
    });
  }

  update(id: string, data: UpdateUnitConnectivityData) {
    return prisma.unitConnectivity.update({
      where: { id },
      data,
      include: {
        unit: true,
        provider: true,
      },
    });
  }

  delete(id: string) {
    return prisma.unitConnectivity.delete({
      where: { id },
    });
  }
}
