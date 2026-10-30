import { prisma } from "../../database/prisma.js";
import type { CreateCompanyData, UpdateCompanyData } from "./companies.types.js";

export class CompaniesRepository {
  create(data: CreateCompanyData) {
    return prisma.company.create({
      data,
    });
  }

  findAll() {
    return prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
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

  update(id: string, data: UpdateCompanyData) {
    return prisma.company.update({
      where: { id },
      data,
    });
  }
}
