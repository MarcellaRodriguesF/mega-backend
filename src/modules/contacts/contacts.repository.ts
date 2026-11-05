import { prisma } from "../../database/prisma.js";

import type { CreateContactData, UpdateContactData } from "./contacts.types.js";

export class ContactsRepository {
  findAllByCompany(companyId: string) {
    return prisma.companyContact.findMany({
      where: {
        companyId,
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

  findById(id: string, companyId: string) {
    return prisma.companyContact.findFirst({
      where: {
        id,
        companyId,
      },
    });
  }

  async create(data: CreateContactData) {
    const { companyId, ...contactData } = data;

    return prisma.$transaction(async (transaction) => {
      if (contactData.isPrimary) {
        await transaction.companyContact.updateMany({
          where: {
            companyId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return transaction.companyContact.create({
        data: {
          ...contactData,
          companyId,
        },
      });
    });
  }

  async update(id: string, companyId: string, data: UpdateContactData) {
    return prisma.$transaction(async (transaction) => {
      if (data.isPrimary === true) {
        await transaction.companyContact.updateMany({
          where: {
            companyId,
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

      return transaction.companyContact.update({
        where: {
          id,
        },
        data,
      });
    });
  }

  delete(id: string) {
    return prisma.companyContact.delete({
      where: {
        id,
      },
    });
  }
}
