import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import {
  assertActivityContext,
  assertRelocation,
  assertSupervisorAvailable,
  resolveOrganization,
} from "../implementations/implementations.rules.js";
import { assertCanComplete, assertCanExecute, type Actor } from "./activities.authorization.js";
import { ActivitiesRepository, captureFromUnit } from "./activities.repository.js";
import type {
  AssignmentInput,
  CreateActivityInput,
  DetachInput,
  ListActivitiesQuery,
  PlacementInput,
  UpdateActivityInput,
} from "./activities.schemas.js";

function notFound(message: string, code: string): never {
  throw new ApiError(message, 404, code);
}

export class ActivitiesService {
  private readonly repository = new ActivitiesRepository();

  listAssignableUsers() {
    return this.repository.listAssignableUsers();
  }

  async create(input: CreateActivityInput) {
    const id = await prisma.$transaction(async (tx) => {
      const unit = input.unitId ? await this.repository.findUnit(input.unitId, tx) : null;
      if (input.unitId && !unit) notFound("Unidade não encontrada.", "ACTIVITY_UNIT_NOT_FOUND");

      const organization = resolveOrganization({ companyId: input.companyId, unit });
      const company =
        !unit && organization.companyId
          ? await this.repository.findCompany(organization.companyId, tx)
          : null;
      if (organization.companyId && !unit && !company) {
        notFound("Cliente não encontrado.", "ACTIVITY_COMPANY_NOT_FOUND");
      }

      const stage = input.stageId ? await this.repository.findStage(input.stageId, tx) : null;
      if (input.stageId && !stage) notFound("Etapa não encontrada.", "ACTIVITY_STAGE_NOT_FOUND");

      const implementationId = input.implementationId ?? stage?.implementationId ?? null;
      if (input.implementationId) {
        const implementation = await this.repository.findImplementation(input.implementationId, tx);
        if (!implementation) notFound("Implantação não encontrada.", "ACTIVITY_IMPLEMENTATION_NOT_FOUND");
      }

      assertActivityContext({
        implementationId,
        stageId: stage?.id ?? null,
        stageImplementationId: stage?.implementationId ?? null,
      });

      const last = await this.repository.nextOrder(tx, {
        implementationId,
        stageId: stage?.id ?? null,
      });
      const captured = captureFromUnit(organization.companyId, unit);
      if (!unit && company) captured.companyTradeName = company.tradeName;

      const created = await this.repository.create(tx, {
        ...captured,
        name: input.name,
        description: input.description,
        implementationId,
        stageId: stage?.id ?? null,
        order: (last?.order ?? -1) + 1,
      });
      return created.id;
    });

    return this.findById(id);
  }

  async findAll(query: ListActivitiesQuery) {
    const page = await this.repository.findPage(query);
    return {
      items: page.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        companyId: item.companyId,
        companyTradeName: item.companyTradeName,
        unitId: item.unitId,
        unitName: item.unitName,
        implementation: item.implementation,
        stage: item.stage,
        assignments: item.assignments,
        independent: item.implementationId === null,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total: page.total,
      totalPages: page.total === 0 ? 0 : Math.ceil(page.total / query.pageSize),
    };
  }

  async findById(id: string) {
    const activity = await this.repository.findById(id);
    if (!activity) notFound("Atividade não encontrada.", "ACTIVITY_NOT_FOUND");
    return {
      ...activity,
      independent: activity.implementationId === null,
      supervisor: activity.assignments.find((item) => item.role === "SUPERVISOR") ?? null,
      executors: activity.assignments.filter((item) => item.role === "EXECUTOR"),
    };
  }

  async update(id: string, input: UpdateActivityInput) {
    await this.findById(id);
    await this.repository.update(id, input);
    return this.findById(id);
  }

  async assign(id: string, input: AssignmentInput) {
    try {
      await prisma.$transaction(async (tx) => {
        const activity = await this.repository.findById(id, tx);
        if (!activity) notFound("Atividade não encontrada.", "ACTIVITY_NOT_FOUND");
        if (input.role === "SUPERVISOR") {
          assertSupervisorAvailable(activity.assignments, input.userId);
        }
        const duplicate = activity.assignments.find(
          (item) => item.userId === input.userId && item.role === input.role,
        );
        if (duplicate) {
          throw new ApiError(
            "Este responsável já está atribuído com esse papel.",
            409,
            "ASSIGNMENT_DUPLICATE",
          );
        }
        const user = await this.repository.findUser(input.userId, tx);
        if (!user) notFound("Usuário não encontrado.", "ACTIVITY_USER_NOT_FOUND");
        await this.repository.assign(tx, {
          activityId: id,
          userId: user.id,
          userName: user.name?.trim() || user.email,
          role: input.role,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(
          "Este responsável já está atribuído com esse papel.",
          409,
          "ASSIGNMENT_DUPLICATE",
        );
      }
      throw error;
    }

    return this.findById(id);
  }

  async removeAssignment(activityId: string, assignmentId: string) {
    const assignment = await this.repository.findAssignment(assignmentId);
    if (!assignment || assignment.activityId !== activityId) {
      notFound("Atribuição não encontrada.", "ASSIGNMENT_NOT_FOUND");
    }
    await this.repository.deleteAssignment(assignmentId);
    return this.findById(activityId);
  }

  async place(actor: Actor, id: string, input: PlacementInput) {
    await prisma.$transaction(async (tx) => {
      const activity = await this.repository.findById(id, tx);
      if (!activity) notFound("Atividade não encontrada.", "ACTIVITY_NOT_FOUND");
      const implementation = await this.repository.findImplementation(input.implementationId, tx);
      if (!implementation) notFound("Implantação não encontrada.", "ACTIVITY_IMPLEMENTATION_NOT_FOUND");
      if (implementation.status === "CANCELLED") {
        throw new ApiError(
          "Não é possível vincular uma atividade a uma implantação cancelada.",
          422,
          "IMPLEMENTATION_CANCELLED",
        );
      }
      const stage = input.stageId ? await this.repository.findStage(input.stageId, tx) : null;
      if (input.stageId && !stage) notFound("Etapa não encontrada.", "ACTIVITY_STAGE_NOT_FOUND");
      assertActivityContext({
        implementationId: implementation.id,
        stageId: stage?.id ?? null,
        stageImplementationId: stage?.implementationId ?? null,
      });
      assertRelocation({
        status: activity.status,
        currentImplementationId: activity.implementationId,
        targetImplementationId: implementation.id,
        acknowledgeCompleted: input.acknowledgeCompleted,
      });
      const last = await this.repository.nextOrder(tx, {
        implementationId: implementation.id,
        stageId: stage?.id ?? null,
      });
      await this.repository.place(tx, id, {
        implementationId: implementation.id,
        stageId: stage?.id ?? null,
        order: (last?.order ?? -1) + 1,
      });
      const actorUser = await this.repository.findUser(actor.id, tx);
      await this.repository.addPlacement(tx, {
        activityId: id,
        fromImplementationId: activity.implementationId,
        toImplementationId: implementation.id,
        fromStageId: activity.stageId,
        toStageId: stage?.id ?? null,
        fromImplementationName: activity.implementation?.name ?? null,
        toImplementationName: implementation.name,
        fromStageName: activity.stage?.name ?? null,
        toStageName: stage?.name ?? null,
        userId: actor.id,
        userName: actorUser?.name?.trim() || actorUser?.email || "Usuário",
        reason: input.reason,
        explicitConfirmation: input.acknowledgeCompleted,
      });
    });

    return this.findById(id);
  }

  async detach(actor: Actor, id: string, input: DetachInput) {
    await prisma.$transaction(async (tx) => {
      const activity = await this.repository.findById(id, tx);
      if (!activity) notFound("Atividade não encontrada.", "ACTIVITY_NOT_FOUND");
      if (!activity.implementationId) {
        throw new ApiError(
          "A atividade já está independente.",
          409,
          "ACTIVITY_ALREADY_INDEPENDENT",
        );
      }
      assertRelocation({
        status: activity.status,
        currentImplementationId: activity.implementationId,
        targetImplementationId: null,
        acknowledgeCompleted: input.acknowledgeCompleted,
      });
      await this.repository.place(tx, id, {
        implementationId: null,
        stageId: null,
        order: 0,
      });
      const actorUser = await this.repository.findUser(actor.id, tx);
      await this.repository.addPlacement(tx, {
        activityId: id,
        fromImplementationId: activity.implementationId,
        toImplementationId: null,
        fromStageId: activity.stageId,
        toStageId: null,
        fromImplementationName: activity.implementation?.name ?? null,
        toImplementationName: null,
        fromStageName: activity.stage?.name ?? null,
        toStageName: null,
        userId: actor.id,
        userName: actorUser?.name?.trim() || actorUser?.email || "Usuário",
        reason: input.reason,
        explicitConfirmation: input.acknowledgeCompleted,
      });
    });

    return this.findById(id);
  }

  async start(actor: Actor, id: string) {
    const activity = await this.repository.findById(id);
    if (!activity) notFound("Atividade não encontrada.", "ACTIVITY_NOT_FOUND");
    await assertCanExecute(actor, activity.assignments);
    if (activity.status === "COMPLETED") {
      throw new ApiError("A atividade já foi concluída.", 409, "ACTIVITY_ALREADY_COMPLETED");
    }
    if (activity.status !== "IN_PROGRESS") {
      await this.repository.setStatus(id, {
        status: "IN_PROGRESS",
        startedAt: activity.startedAt ?? new Date(),
      });
    }
    return this.findById(id);
  }

  async complete(actor: Actor, id: string) {
    const activity = await this.repository.findById(id);
    if (!activity) notFound("Atividade não encontrada.", "ACTIVITY_NOT_FOUND");
    await assertCanComplete(actor, activity.assignments);
    if (activity.status === "COMPLETED") {
      throw new ApiError("A atividade já foi concluída.", 409, "ACTIVITY_ALREADY_COMPLETED");
    }
    await this.repository.setStatus(id, {
      status: "COMPLETED",
      startedAt: activity.startedAt ?? new Date(),
      completedAt: new Date(),
    });
    return this.findById(id);
  }
}
