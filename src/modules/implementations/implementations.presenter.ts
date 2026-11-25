export interface AddressView {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

export interface ProviderView {
  id: string;
  name: string;
}

export interface ActiveConnectivityView {
  id: string;
  name: string | null;
  technology: string;
  downloadCapacityMbps: number | null;
  uploadCapacityMbps: number | null;
  responseTimeMs: number | null;
  throughputMbps: number | null;
  rxSignalDbm: number | null;
  publicIp: string | null;
  gatewayIp: string | null;
  localIp: string | null;
  wanIp: string | null;
  networkName: string | null;
  slaPercentage: number | null;
  mttrHours: number | null;
  monitoringEnabled: boolean;
  serviceStartDate: Date | null;
  serviceEndDate: Date | null;
  observations: string | null;
  provider: ProviderView | null;
}

export interface UnitContextView {
  id: string;
  name: string;
  type: string;
  status: string;
  company: {
    id: string;
    tradeName: string;
  };
  address: AddressView | null;
  activeConnectivity: ActiveConnectivityView | null;
}

export interface CatalogTemplateView {
  id: string;
  name: string;
  description: string | null;
  stageCount: number;
  activityCount: number;
}

interface ConnectivitySource {
  id: string;
  name: string | null;
  technology: string;
  downloadCapacityMbps: number | null;
  uploadCapacityMbps: number | null;
  responseTimeMs: number | null;
  throughputMbps: number | null;
  rxSignalDbm: number | null;
  publicIp: string | null;
  gatewayIp: string | null;
  localIp: string | null;
  wanIp: string | null;
  networkName: string | null;
  slaPercentage: number | null;
  mttrHours: number | null;
  monitoringEnabled: boolean;
  serviceStartDate: Date | null;
  serviceEndDate: Date | null;
  observations: string | null;
  provider: ProviderView | null;
}

interface UnitContextSource {
  id: string;
  name: string;
  type: string;
  status: string;
  company: { id: string; tradeName: string };
  address: AddressView | null;
  connectivities: ConnectivitySource[];
}

export function toActiveConnectivity(
  connectivity: ConnectivitySource | undefined,
): ActiveConnectivityView | null {
  if (!connectivity) return null;

  return {
    id: connectivity.id,
    name: connectivity.name,
    technology: connectivity.technology,
    downloadCapacityMbps: connectivity.downloadCapacityMbps,
    uploadCapacityMbps: connectivity.uploadCapacityMbps,
    responseTimeMs: connectivity.responseTimeMs,
    throughputMbps: connectivity.throughputMbps,
    rxSignalDbm: connectivity.rxSignalDbm,
    publicIp: connectivity.publicIp,
    gatewayIp: connectivity.gatewayIp,
    localIp: connectivity.localIp,
    wanIp: connectivity.wanIp,
    networkName: connectivity.networkName,
    slaPercentage: connectivity.slaPercentage,
    mttrHours: connectivity.mttrHours,
    monitoringEnabled: connectivity.monitoringEnabled,
    serviceStartDate: connectivity.serviceStartDate,
    serviceEndDate: connectivity.serviceEndDate,
    observations: connectivity.observations,
    provider: connectivity.provider
      ? { id: connectivity.provider.id, name: connectivity.provider.name }
      : null,
  };
}

export function toUnitContext(unit: UnitContextSource): UnitContextView {
  return {
    id: unit.id,
    name: unit.name,
    type: unit.type,
    status: unit.status,
    company: {
      id: unit.company.id,
      tradeName: unit.company.tradeName,
    },
    address: unit.address,
    activeConnectivity: toActiveConnectivity(unit.connectivities[0]),
  };
}

export function toCatalogTemplate(template: {
  id: string;
  name: string;
  description: string | null;
  stages: { _count: { activities: number } }[];
}): CatalogTemplateView {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    stageCount: template.stages.length,
    activityCount: template.stages.reduce(
      (total, stage) => total + stage._count.activities,
      0,
    ),
  };
}

export function toImplementationSummary(item: {
  id: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  unitId: string;
  unitName: string;
  companyId: string;
  companyTradeName: string;
  templateId: string | null;
  templateName: string;
  initialProviderId: string | null;
  initialProviderName: string | null;
  stages: { _count: { activities: number } }[];
}) {
  return {
    id: item.id,
    status: item.status,
    startedAt: item.startedAt,
    completedAt: item.completedAt,
    unitId: item.unitId,
    unitName: item.unitName,
    companyId: item.companyId,
    companyTradeName: item.companyTradeName,
    templateId: item.templateId,
    templateName: item.templateName,
    initialProvider: item.initialProviderId
      ? { id: item.initialProviderId, name: item.initialProviderName }
      : null,
    stageCount: item.stages.length,
    activityCount: item.stages.reduce(
      (total, stage) => total + stage._count.activities,
      0,
    ),
  };
}

export interface StoredImplementation {
  id: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  unitId: string;
  companyId: string;
  templateId: string | null;
  templateName: string;
  templateDescription: string | null;
  unitName: string;
  companyTradeName: string;
  addressZipCode: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  initialProviderId: string | null;
  initialProviderName: string | null;
  createdAt: Date;
  updatedAt: Date;
  stages: {
    id: string;
    name: string;
    description: string | null;
    order: number;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    sourceStageId: string | null;
    activities: {
      id: string;
      name: string;
      description: string | null;
      order: number;
      status: string;
      startedAt: Date | null;
      completedAt: Date | null;
      sourceActivityId: string | null;
      assignments: {
        id: string;
        userId: string;
        userName: string;
        role: string;
        createdAt: Date;
      }[];
      requirements: {
        id: string;
        type: string;
        isRequired: boolean;
        order: number;
        configuration: unknown;
        formSnapshotId: string | null;
        sourceRequirementId: string | null;
        formSnapshot: {
          id: string;
          name: string;
          sourceFormTemplateId: string | null;
        } | null;
        evidenceTypes: { id: string; type: string }[];
      }[];
    }[];
  }[];
  formSnapshots: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    sourceFormTemplateId: string | null;
    fields: {
      id: string;
      key: string;
      label: string;
      description: string | null;
      type: string;
      placeholder: string | null;
      isRequired: boolean;
      order: number;
      options: unknown;
      isSensitive: boolean;
      connectivityFieldTarget: string | null;
      sourceFormFieldId: string | null;
    }[];
  }[];
}

export function toImplementationDetail(
  implementation: StoredImplementation,
  liveUnit: UnitContextSource | null,
) {
  return {
    id: implementation.id,
    status: implementation.status,
    startedAt: implementation.startedAt,
    completedAt: implementation.completedAt,
    createdAt: implementation.createdAt,
    updatedAt: implementation.updatedAt,
    template: {
      id: implementation.templateId,
      name: implementation.templateName,
      description: implementation.templateDescription,
    },
    capturedUnit: {
      id: implementation.unitId,
      name: implementation.unitName,
      company: {
        id: implementation.companyId,
        tradeName: implementation.companyTradeName,
      },
      address: {
        zipCode: implementation.addressZipCode,
        street: implementation.addressStreet,
        number: implementation.addressNumber,
        complement: implementation.addressComplement,
        neighborhood: implementation.addressNeighborhood,
        city: implementation.addressCity,
        state: implementation.addressState,
      },
      initialProvider: implementation.initialProviderId
        ? {
            id: implementation.initialProviderId,
            name: implementation.initialProviderName,
          }
        : null,
    },
    unit: liveUnit ? toUnitContext(liveUnit) : null,
    stages: implementation.stages.map((stage) => ({
      id: stage.id,
      sourceStageId: stage.sourceStageId,
      name: stage.name,
      description: stage.description,
      order: stage.order,
      status: stage.status,
      startedAt: stage.startedAt,
      completedAt: stage.completedAt,
      activities: stage.activities.map((activity) => ({
        id: activity.id,
        sourceActivityId: activity.sourceActivityId,
        name: activity.name,
        description: activity.description,
        order: activity.order,
        status: activity.status,
        startedAt: activity.startedAt,
        completedAt: activity.completedAt,
        assignments: activity.assignments,
        requirements: activity.requirements.map((requirement) => ({
          id: requirement.id,
          sourceRequirementId: requirement.sourceRequirementId,
          type: requirement.type,
          isRequired: requirement.isRequired,
          order: requirement.order,
          configuration: requirement.configuration,
          formSnapshotId: requirement.formSnapshotId,
          formSnapshot: requirement.formSnapshot,
          evidenceTypes: requirement.evidenceTypes,
        })),
      })),
    })),
    formSnapshots: implementation.formSnapshots,
    connectivityEditable: false as const,
  };
}

export type ImplementationDetail = ReturnType<typeof toImplementationDetail>;
