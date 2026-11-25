import { AuthorizationRepository } from "../authorization/authorization.repository.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";
import { ApiError } from "../../shared/http/api-error.js";

export interface Actor {
  id: string;
  accessProfileId: string;
}

export interface AssignmentRef {
  userId: string;
  role: string;
}

const authorizationRepository = new AuthorizationRepository();

async function codesOf(actor: Actor) {
  const codes = await authorizationRepository.findPermissionCodesByProfileId(
    actor.accessProfileId,
  );
  return new Set(codes);
}

function forbidden(message: string, code: string): never {
  throw new ApiError(message, 403, code);
}

export async function assertCanExecute(actor: Actor, assignments: AssignmentRef[]) {
  const codes = await codesOf(actor);
  if (codes.has(PERMISSIONS.ACTIVITIES_MANAGE)) return;

  const assigned = assignments.some(
    (item) => item.userId === actor.id && item.role === "EXECUTOR",
  );

  if (codes.has(PERMISSIONS.ACTIVITIES_EXECUTE) && assigned) return;

  forbidden(
    "Você precisa da permissão de execução e estar atribuído como executor.",
    "ACTIVITY_EXECUTE_FORBIDDEN",
  );
}

export async function assertCanComplete(actor: Actor, assignments: AssignmentRef[]) {
  const codes = await codesOf(actor);
  if (codes.has(PERMISSIONS.ACTIVITIES_MANAGE)) return;

  const assigned = assignments.some(
    (item) => item.userId === actor.id && item.role === "SUPERVISOR",
  );

  if (codes.has(PERMISSIONS.ACTIVITIES_COMPLETE) && assigned) return;

  forbidden(
    "Você precisa da permissão de conclusão e estar atribuído como supervisor.",
    "ACTIVITY_COMPLETE_FORBIDDEN",
  );
}
