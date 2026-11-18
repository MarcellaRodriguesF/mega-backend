export const STORAGE_CONTEXTS = ["documents", "evidences"] as const;

export type StorageContext = (typeof STORAGE_CONTEXTS)[number];

export interface StoredFile {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IncomingStoredFile {
  buffer: Buffer;
  originalName: string;
}
