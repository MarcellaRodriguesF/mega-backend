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
  "EXECUTION",
  "COMPLETION",
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
