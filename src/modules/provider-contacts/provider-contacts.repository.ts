import { prisma } from "../../database/prisma.js";

import type {
  CreateProviderContactData,
  UpdateProviderContactData,
} from "./provider-contacts.types.js";

export class ProviderContactsRepository {
  findAllByProvider(providerId: string) {
    return prisma.providerContact.findMany({
      where: {
        providerId,
      },
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          name: "asc",
        },
      ],
    });
  }

  findById(id: string, providerId: string) {
    return prisma.providerContact.findFirst({
      where: {
        id,
        providerId,
      },
    });
  }

  async create(data: CreateProviderContactData) {
    const { providerId, ...contactData } = data;

    return prisma.$transaction(async (transaction) => {
      if (contactData.isPrimary) {
        await transaction.providerContact.updateMany({
          where: {
            providerId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return transaction.providerContact.create({
        data: {
          ...contactData,
          providerId,
        },
      });
    });
  }

  async update(id: string, providerId: string, data: UpdateProviderContactData) {
    return prisma.$transaction(async (transaction) => {
      if (data.isPrimary === true) {
        await transaction.providerContact.updateMany({
          where: {
            providerId,
            id: {
              not: id,
            },
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return transaction.providerContact.update({
        where: {
          id,
        },
        data,
      });
    });
  }

  delete(id: string) {
    return prisma.providerContact.delete({
      where: {
        id,
      },
    });
  }
}
