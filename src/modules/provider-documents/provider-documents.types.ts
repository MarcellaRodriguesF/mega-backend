export interface CreateProviderDocumentData {
  providerId: string;
  name: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  observations: string | null;
}

export interface UpdateProviderDocumentData {
  name?: string;
  fileName?: string;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  observations?: string | null;
}
