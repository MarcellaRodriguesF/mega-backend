
import { prisma } from "../../database/prisma.js";
import type {
  CreateUnitData,
  UpdateUnitData,
} from "./units.types.js";

export class UnitsRepository {
  create(data: CreateUnitData) {
    const { address, ...unitData } = data;

    return prisma.unit.create({
      data: {
        ...unitData,
        ...(address && {
          address: {
            create: address,
          },
        }),
      },
      include: {
        company: true,
        address: true,
        connectivities: true,
      },
    });
  }

  findAll() {
    return prisma.unit.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        company: true,
        address: true,
        _count: {
          select: {
            connectivities: true,
            documents: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.unit.findUnique({
      where: { id },
      include: {
        company: true,
        address: true,
        documents: true,
        connectivities: {
          include: {
            provider: true,
          },
        },
      },
    });
  }

  findCompanyById(companyId: string) {
    return prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });
  }

  async update(id: string, data: UpdateUnitData) {
    const { address, ...unitData } = data;

    return prisma.$transaction(async (transaction) => {
      await transaction.unit.update({
        where: { id },
        data: unitData,
      });

      if (address) {
        const existingAddress = await transaction.unitAddress.findUnique({
          where: {
            unitId: id,
          },
        });

        if (existingAddress) {
          await transaction.unitAddress.update({
            where: {
              id: existingAddress.id,
            },
            data: address,
          });
        } else {
          await transaction.unitAddress.create({
            data: {
              ...address,
              unitId: id,
            },
          });
        }
      }

      return transaction.unit.findUnique({
        where: { id },
        include: {
          company: true,
          address: true,
          documents: true,
          connectivities: {
            include: {
              provider: true,
            },
          },
        },
      });
    });
  }

  delete(id: string) {
    return prisma.unit.delete({
      where: { id },
    });
  }
}
