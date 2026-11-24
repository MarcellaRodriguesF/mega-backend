-- Rollback:
-- DROP INDEX "unit_connectivities_one_active_per_unit_idx";
-- CREATE UNIQUE INDEX "unit_connectivities_one_active_combo_idx" ON "unit_connectivities"("unit_id", "provider_id", "technology") WHERE (status = 'ACTIVE');

-- Mantém somente a conectividade ativa mais recente de cada unidade.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY unit_id
      ORDER BY updated_at DESC, created_at DESC
    ) AS rn
  FROM unit_connectivities
  WHERE status = 'ACTIVE'
)
UPDATE unit_connectivities
SET
  status = 'INACTIVE',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id
  FROM ranked
  WHERE rn > 1
);

DROP INDEX IF EXISTS "unit_connectivities_one_active_combo_idx";

CREATE UNIQUE INDEX "unit_connectivities_one_active_per_unit_idx"
ON "unit_connectivities"("unit_id")
WHERE (status = 'ACTIVE');
