-- Rollback:
-- DROP INDEX "unit_connectivities_one_active_combo_idx";

-- CreateIndex
CREATE UNIQUE INDEX "unit_connectivities_one_active_combo_idx" ON "unit_connectivities"("unit_id", "provider_id", "technology") WHERE (status = 'ACTIVE');
