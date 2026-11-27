
import type {
    CreateUnitInput,
    UpdateUnitInput,
  } from "./units.schemas.js";
  
  export type CreateUnitData = CreateUnitInput;
  export type UpdateUnitData = UpdateUnitInput;

  export type CompanyUnitProvider = {
    id: string;
    name: string;
    phone: string | null;
  };

  export type CompanyUnitListItem = {
    id: string;
    name: string;
    status: string;
    publicIp: string | null;
    provider: CompanyUnitProvider | null;
  };
  