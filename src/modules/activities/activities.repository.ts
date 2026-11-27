import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import {
  captureFromUnit,
  type CapturedContext,
} from "../implementations/implementations.repository.js";
import type { ListActivitiesQuery } from "./activities.schemas.js";

const activityDetailInclude = {
  assignments: { orderBy: { createdAt: "asc" as const } },
  requirements: {
    orderBy: { order: "asc" as const },
    include: {
      evidenceTypes: { orderBy: { type: "asc" as const } },
      evidences: true,
    },
  },
  formSnapshots: {
    orderBy: { name: "asc" as const },
    include: { fields: { orderBy: { order: "asc" as const }, include: { responses: true } } },
  },
  evidences: true,
  placements: { orderBy: { createdAt: "desc" as const } },
  implementation: { select: { id: true, name: true } },
  stage: { select: { id: true, name: true, implementationId: true } },
} satisfies Prisma.ActivityInclude;

type Db = Prisma.TransactionClient | typeof prisma;

export class ActivitiesRepository {
  findById(id: string, db: Db = prisma) {
    return db.activity.findUnique({ where: { id }, include: activityDetailInclude });
  }

  findUser(id: string, db: Db = prisma) {
    return db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
  }

  findImplementation(id: string, db: Db = prisma) {
    return db.implementation.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });
  }

  findStage(id: string, db: Db = prisma) {
    return db.implementationStage.findUnique({
      where: { id },
      select: { id: true, name: true, implementationId: true },
    });
  }

  findUnit(id: string, db: Db = prisma) {
    return db.unit.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        companyId: true,
        company: { select: { id: true, tradeName: true } },
        address: {
          select: {
            zipCode: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
          },
        },
        connectivities: {
          where: { status: "ACTIVE" },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { provider: { select: { id: true, name: true } } },
        },
      },
    });
  }

  listAssignableUsers() {
    return prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true },
    });
  }

  findCompany(id: string, db: Db = prisma) {
    return db.company.findUnique({
      where: { id },
      select: { id: true, tradeName: true },
    });
  }

  nextOrder(
    db: Db,
    input: { implementationId: string | null; stageId: string | null },
  ) {
    if (input.stageId) {
      return db.activity.findFirst({
        where: { stageId: input.stageId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
    }

    if (input.implementationId) {
      return db.activity.findFirst({
        where: { implementationId: input.implementationId, stageId: null },
        orderBy: { order: "desc" },
        select: { order: true },
      });
    }

    return Promise.resolve(null);
  }

  create(
    db: Db,
    data: CapturedContext & {
      name: string;
      description: string | null;
      implementationId: string | null;
      stageId: string | null;
      order: number;
    },
  ) {
    return db.activity.create({
      data: { ...data, status: "NOT_STARTED" },
      select: { id: true },
    });
  }

  async findPage(query: ListActivitiesQuery) {
    const where: Prisma.ActivityWhereInput = {
      ...(query.scope === "independent" ? { implementationId: null } : {}),
      ...(query.scope === "linked" ? { implementationId: { not: null } } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(query.implementationId ? { implementationId: query.implementationId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const total = await prisma.activity.count({ where });
    const items = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        assignments: { select: { id: true, userId: true, userName: true, role: true } },
        implementation: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
    });
    return { total, items };
  }

  update(id: string, data: { name: string; description: string | null }) {
    return prisma.activity.update({ where: { id }, data, select: { id: true } });
  }

  place(
    db: Db,
    id: string,
    data: { implementationId: string | null; stageId: string | null; order: number },
  ) {
    return db.activity.update({ where: { id }, data, select: { id: true } });
  }

  addPlacement(
    db: Db,
    data: {
      activityId: string;
      fromImplementationId: string | null;
      toImplementationId: string | null;
      fromStageId: string | null;
      toStageId: string | null;
      fromImplementationName: string | null;
      toImplementationName: string | null;
      fromStageName: string | null;
      toStageName: string | null;
      userId: string;
      userName: string;
      reason: string | null;
      explicitConfirmation: boolean;
    },
  ) {
    return db.activityPlacement.create({ data });
  }

  assign(
    db: Db,
    data: { activityId: string; userId: string; userName: string; role: "EXECUTOR" | "SUPERVISOR" },
  ) {
    return db.activityAssignment.create({ data });
  }

  deleteAssignment(id: string) {
    return prisma.activityAssignment.delete({ where: { id } });
  }

  findAssignment(id: string) {
    return prisma.activityAssignment.findUnique({ where: { id } });
  }

  setStatus(
    id: string,
    data: { status: "IN_PROGRESS" | "COMPLETED"; startedAt?: Date; completedAt?: Date },
  ) {
    return prisma.activity.update({ where: { id }, data, select: { id: true } });
  }
}

export { captureFromUnit };
