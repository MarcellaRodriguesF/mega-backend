import { ApiError } from "../../shared/http/api-error.js";

export const IMPLEMENTATION_STATUSES = [
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const IMPLEMENTATION_WORK_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export const IMPLEMENTATION_ASSIGNMENT_ROLES = [
  "EXECUTOR",
  "SUPERVISOR",
] as const;

/**
 * Allowlist fechada de propriedades de UnitConnectivity.
 * Publicação futura só pode usar estes destinos, nunca um nome de coluna recebido do cliente.
 * publicIp, gatewayIp, localIp e wanIp permanecem distintos.
 */
export const CONNECTIVITY_FIELD_TARGETS = [
  "PROVIDER_ID",
  "TECHNOLOGY",
  "DOWNLOAD_CAPACITY_MBPS",
  "UPLOAD_CAPACITY_MBPS",
  "RESPONSE_TIME_MS",
  "THROUGHPUT_MBPS",
  "RX_SIGNAL_DBM",
  "PUBLIC_IP",
  "GATEWAY_IP",
  "LOCAL_IP",
  "WAN_IP",
  "NETWORK_NAME",
  "SLA_PERCENTAGE",
  "MTTR_HOURS",
  "MONITORING_ENABLED",
  "SERVICE_START_DATE",
  "SERVICE_END_DATE",
  "OBSERVATIONS",
  "CONNECTIVITY_NAME",
] as const;

export type ImplementationStatusValue = (typeof IMPLEMENTATION_STATUSES)[number];
export type ConnectivityFieldTargetValue =
  (typeof CONNECTIVITY_FIELD_TARGETS)[number];

const CONNECTIVITY_FIELD_TARGET_SET = new Set<string>(CONNECTIVITY_FIELD_TARGETS);

export function assertImplementationTemplatePublished(status: string) {
  if (status !== "PUBLISHED") {
    throw new ApiError(
      "A implantação só pode ser criada a partir de um template publicado.",
      422,
      "TEMPLATE_NOT_PUBLISHED",
    );
  }
}

export function assertTemplateHasExecutableStructure(template: {
  stages: { activities: unknown[] }[];
}) {
  const activityCount = template.stages.reduce(
    (total, stage) => total + stage.activities.length,
    0,
  );

  if (template.stages.length === 0 || activityCount === 0) {
    throw new ApiError(
      "O template publicado não possui etapas e atividades para copiar.",
      422,
      "TEMPLATE_STRUCTURE_INVALID",
    );
  }
}

export function assertConnectivityFieldTarget(
  target: string,
): ConnectivityFieldTargetValue {
  if (!CONNECTIVITY_FIELD_TARGET_SET.has(target)) {
    throw new ApiError(
      "O campo não pode ser publicado nesta propriedade da conectividade.",
      422,
      "CONNECTIVITY_TARGET_INVALID",
    );
  }

  return target as ConnectivityFieldTargetValue;
}

export interface InitialProviderSource {
  provider: { id: string; name: string } | null;
}

export function resolveOrganization(input: {
  companyId: string | null;
  unit: { id: string; companyId: string } | null;
}) {
  if (input.unit) {
    if (input.companyId && input.companyId !== input.unit.companyId) {
      throw new ApiError(
        "A unidade não pertence ao cliente informado.",
        422,
        "UNIT_COMPANY_MISMATCH",
      );
    }

    return {
      companyId: input.unit.companyId,
      unitId: input.unit.id,
    };
  }

  return {
    companyId: input.companyId,
    unitId: null,
  };
}

export function assertActivityContext(input: {
  implementationId: string | null;
  stageId: string | null;
  stageImplementationId: string | null;
}) {
  if (input.stageId && !input.implementationId) {
    throw new ApiError(
      "Uma atividade dentro de etapa precisa pertencer à implantação dessa etapa.",
      422,
      "ACTIVITY_STAGE_WITHOUT_IMPLEMENTATION",
    );
  }

  if (
    input.stageId &&
    input.stageImplementationId !== input.implementationId
  ) {
    throw new ApiError(
      "A etapa não pertence à implantação informada.",
      422,
      "STAGE_IMPLEMENTATION_MISMATCH",
    );
  }
}

export function assertRelocation(input: {
  status: string;
  currentImplementationId: string | null;
  targetImplementationId: string | null;
  acknowledgeCompleted: boolean;
}) {
  if (input.status === "COMPLETED" && !input.acknowledgeCompleted) {
    throw new ApiError(
      "Confirme explicitamente a movimentação de uma atividade concluída.",
      422,
      "ACTIVITY_COMPLETED_MOVE_REQUIRES_CONFIRMATION",
    );
  }

  if (
    input.currentImplementationId &&
    input.targetImplementationId &&
    input.currentImplementationId !== input.targetImplementationId
  ) {
    throw new ApiError(
      "A atividade já está vinculada a outra implantação.",
      409,
      "ACTIVITY_ALREADY_LINKED",
    );
  }
}

export function assertSupervisorAvailable(
  assignments: { role: string; userId: string }[],
  userId: string,
) {
  const supervisor = assignments.find((item) => item.role === "SUPERVISOR");

  if (supervisor && supervisor.userId !== userId) {
    throw new ApiError(
      "A atividade já possui um supervisor.",
      409,
      "SUPERVISOR_ALREADY_ASSIGNED",
    );
  }
}

export function resolveInitialProvider(connectivity: InitialProviderSource | null) {
  if (!connectivity?.provider) {
    return {
      initialProviderId: null,
      initialProviderName: null,
    };
  }

  return {
    initialProviderId: connectivity.provider.id,
    initialProviderName: connectivity.provider.name,
  };
}
