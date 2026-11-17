import type {
  CreateProviderDocumentInput,
  UpdateProviderDocumentInput,
} from "./provider-documents.schemas.js";

export type CreateProviderDocumentData = CreateProviderDocumentInput & {
  providerId: string;
  storageKey: string;
};

export type UpdateProviderDocumentData = UpdateProviderDocumentInput;
