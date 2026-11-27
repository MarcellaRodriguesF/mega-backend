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
  name: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  unitId: string | null;
  unitName: string | null;
  companyId: string | null;
  companyTradeName: string | null;
  templateId: string | null;
  templateName: string | null;
  initialProviderId: string | null;
  initialProviderName: string | null;
  _count: { stages: number; activities: number };
}) {
  return {
    id: item.id,
    name: item.name,
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
    stageCount: item._count.stages,
    activityCount: item._count.activities,
  };
}

interface StoredActivity {
  id: string;
  name: string;
  description: string | null;
  order: number;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  sourceActivityId: string | null;
  implementationId: string | null;
  stageId: string | null;
  companyId: string | null;
  unitId: string | null;
  unitName: string | null;
  companyTradeName: string | null;
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
    formSnapshot: { id: string; name: string; sourceFormTemplateId: string | null } | null;
    evidenceTypes: { id: string; type: string }[];
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

function mapActivity(activity: StoredActivity) {
  return {
    id: activity.id,
    implementationId: activity.implementationId,
    stageId: activity.stageId,
    sourceActivityId: activity.sourceActivityId,
    name: activity.name,
    description: activity.description,
    order: activity.order,
    status: activity.status,
    startedAt: activity.startedAt,
    completedAt: activity.completedAt,
    companyId: activity.companyId,
    unitId: activity.unitId,
    unitName: activity.unitName,
    companyTradeName: activity.companyTradeName,
    assignments: activity.assignments,
    requirements: activity.requirements,
    formSnapshots: activity.formSnapshots,
  };
}

export interface StoredImplementation {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  unitId: string | null;
  companyId: string | null;
  templateId: string | null;
  templateName: string | null;
  templateDescription: string | null;
  unitName: string | null;
  companyTradeName: string | null;
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
  activities: StoredActivity[];
  stages: {
    id: string;
    name: string;
    description: string | null;
    order: number;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    sourceStageId: string | null;
    activities: StoredActivity[];
  }[];
}

export function toImplementationDetail(
  implementation: StoredImplementation,
  liveUnit: UnitContextSource | null,
) {
  return {
    id: implementation.id,
    name: implementation.name,
    description: implementation.description,
    status: implementation.status,
    startedAt: implementation.startedAt,
    completedAt: implementation.completedAt,
    createdAt: implementation.createdAt,
    updatedAt: implementation.updatedAt,
    template: implementation.templateId || implementation.templateName
      ? {
          id: implementation.templateId,
          name: implementation.templateName,
          description: implementation.templateDescription,
        }
      : null,
    captured: {
      companyId: implementation.companyId,
      companyTradeName: implementation.companyTradeName,
      unitId: implementation.unitId,
      unitName: implementation.unitName,
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
    directActivities: implementation.activities.map(mapActivity),
    stages: implementation.stages.map((stage) => ({
      id: stage.id,
      sourceStageId: stage.sourceStageId,
      name: stage.name,
      description: stage.description,
      order: stage.order,
      status: stage.status,
      startedAt: stage.startedAt,
      completedAt: stage.completedAt,
      activities: stage.activities.map(mapActivity),
    })),
    connectivityEditable: false as const,
  };
}

export type ImplementationDetail = ReturnType<typeof toImplementationDetail>;
