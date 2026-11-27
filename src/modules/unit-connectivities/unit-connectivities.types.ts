import type { RecordStatus } from "../../shared/enums/record-status.enum.js";
import type {
  CreateUnitConnectivityInput,
  UpdateUnitConnectivityInput,
} from "./unit-connectivities.schemas.js";

export type CreateUnitConnectivityData = Omit<
  CreateUnitConnectivityInput,
  "name"
> & {
  name: string;
  status: RecordStatus;
};

export type UpdateUnitConnectivityData = UpdateUnitConnectivityInput & {
  status?: RecordStatus;
};
