export interface CreateProviderDocumentData {
  providerId: string | null;
  companyId?: string | null;
  unitId?: string | null;
  name: string;
  type?: string | null;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  observations: string | null;
}

export interface UpdateProviderDocumentData {
  name?: string;
  type?: string | null;
  unitId?: string | null;
  fileName?: string;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  observations?: string | null;
}
