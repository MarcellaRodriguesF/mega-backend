import { prisma } from "../../database/prisma.js";
import type {
  CreateProviderData,
  UpdateProviderData,
} from "./providers.types.js";

export class ProvidersRepository {
  create(data: CreateProviderData) {
    return prisma.provider.create({
      data,
      include: {
        contacts: true,
        documents: true,
        connectivities: true,
      },
    });
  }

  findAll() {
    return prisma.provider.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        contacts: true,
        documents: true,
        _count: {
          select: {
            connectivities: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.provider.findUnique({
      where: { id },
      include: {
        contacts: true,
        documents: true,
        connectivities: {
          include: {
            unit: true,
          },
        },
      },
    });
  }

  update(id: string, data: UpdateProviderData) {
    return prisma.provider.update({
      where: { id },
      data,
      include: {
        contacts: true,
        documents: true,
        connectivities: {
          include: {
            unit: true,
          },
        },
      },
    });
  }

  delete(id: string) {
    return prisma.provider.delete({
      where: { id },
    });
  }
}
