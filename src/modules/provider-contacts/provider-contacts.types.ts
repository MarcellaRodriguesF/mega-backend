import type {
  CreateProviderContactInput,
  UpdateProviderContactInput,
} from "./provider-contacts.schemas.js";

export type CreateProviderContactData = CreateProviderContactInput & {
  providerId: string;
};

export type UpdateProviderContactData = UpdateProviderContactInput;
