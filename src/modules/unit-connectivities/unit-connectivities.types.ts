import type { RecordStatus } from "../../shared/enums/record-status.enum.js";
import type {
  CreateUnitConnectivityInput,
  UpdateUnitConnectivityInput,
} from "./unit-connectivities.schemas.js";

export type CreateUnitConnectivityData = CreateUnitConnectivityInput & {
  status: RecordStatus;
};

export type UpdateUnitConnectivityData = UpdateUnitConnectivityInput & {
  status?: RecordStatus;
};

export type UnitConnectivityCombo = {
  unitId: string;
  providerId: string;
  technology: string;
  excludeId?: string;
};
