import { prisma } from "../../database/prisma.js";

import type {
  CreateProviderDocumentData,
  UpdateProviderDocumentData,
} from "./provider-documents.types.js";

export class ProviderDocumentsRepository {
  findAllByProvider(providerId: string) {
    return prisma.providerDocument.findMany({
      where: {
        providerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findById(id: string, providerId: string) {
    return prisma.providerDocument.findFirst({
      where: {
        id,
        providerId,
      },
    });
  }

  create(data: CreateProviderDocumentData) {
    return prisma.providerDocument.create({
      data,
    });
  }

  update(id: string, data: UpdateProviderDocumentData) {
    return prisma.providerDocument.update({
      where: {
        id,
      },
      data,
    });
  }

  delete(id: string) {
    return prisma.providerDocument.delete({
      where: {
        id,
      },
    });
  }
}
