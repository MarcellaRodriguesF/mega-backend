import { prisma } from "../../database/prisma.js";
import type {
  CreateCompanyData,
  UpdateCompanyData,
} from "./companies.types.js";

export class CompaniesRepository {
  create(data: CreateCompanyData) {
    const { address, ...companyData } = data;

    return prisma.company.create({
      data: {
        ...companyData,
        ...(address && {
          addresses: {
            create: address,
          },
        }),
      },
      include: {
        addresses: true,
      },
    });
  }

  findAll() {
    return prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        addresses: true,
      },
    });
  }

  findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        addresses: true,
        contacts: true,
        opportunities: true,
      },
    });
  }

  findByCnpj(cnpj: string) {
    return prisma.company.findUnique({
      where: { cnpj },
    });
  }

  async update(id: string, data: UpdateCompanyData) {
    const { address, ...companyData } = data;

    return prisma.$transaction(async (transaction) => {
      await transaction.company.update({
        where: { id },
        data: companyData,
      });

      if (address) {
        // Primeiro tenta localizar o endereço principal.
        let existingAddress = await transaction.companyAddress.findFirst({
          where: {
            companyId: id,
            isPrimary: true,
          },
        });

        // Se não houver endereço principal, reutiliza o mais antigo.
        if (!existingAddress) {
          existingAddress = await transaction.companyAddress.findFirst({
            where: {
              companyId: id,
            },
            orderBy: {
              createdAt: "asc",
            },
          });
        }

        if (existingAddress) {
          await transaction.companyAddress.update({
            where: {
              id: existingAddress.id,
            },
            data: address,
          });
        } else {
          await transaction.companyAddress.create({
            data: {
              ...address,
              companyId: id,
            },
          });
        }
      }

      return transaction.company.findUnique({
        where: { id },
        include: {
          addresses: true,
          contacts: true,
          opportunities: true,
        },
      });
    });
  }
}
