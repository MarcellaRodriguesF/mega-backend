-- Move legacy unit-document metadata into the shared company/provider store.
-- The storage key is preserved; no physical file is copied or deleted.
INSERT INTO "provider_documents" (
    "id",
    "provider_id",
    "company_id",
    "unit_id",
    "name",
    "type",
    "file_name",
    "storage_key",
    "mime_type",
    "size_bytes",
    "expires_at",
    "observations",
    "created_at",
    "updated_at"
)
SELECT
    unit_documents."id",
    NULL,
    units."company_id",
    unit_documents."unit_id",
    unit_documents."name",
    unit_documents."type",
    unit_documents."file_name",
    unit_documents."storage_key",
    unit_documents."mime_type",
    unit_documents."size_bytes",
    unit_documents."expires_at",
    unit_documents."observations",
    unit_documents."created_at",
    unit_documents."updated_at"
FROM "unit_documents"
INNER JOIN "units" ON units."id" = unit_documents."unit_id";

DELETE FROM "unit_documents";
