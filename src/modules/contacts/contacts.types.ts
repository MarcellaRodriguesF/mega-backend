import type {
  CreateContactInput,
  UpdateContactInput,
} from "./contacts.schemas.js";

export type CreateContactData = CreateContactInput & {
  companyId: string;
};

export type UpdateContactData = UpdateContactInput;
