-- AlterTable
ALTER TABLE "provider_documents" ADD COLUMN     "company_id" UUID,
ADD COLUMN     "unit_id" UUID,
ALTER COLUMN "provider_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "provider_documents_company_id_idx" ON "provider_documents"("company_id");

-- CreateIndex
CREATE INDEX "provider_documents_unit_id_idx" ON "provider_documents"("unit_id");

-- AddForeignKey
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

