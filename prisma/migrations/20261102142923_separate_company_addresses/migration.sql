/*
  Warnings:

  - You are about to drop the column `city` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `complement` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "city",
DROP COLUMN "complement",
DROP COLUMN "neighborhood",
DROP COLUMN "number",
DROP COLUMN "state",
DROP COLUMN "street",
DROP COLUMN "zip_code",
ALTER COLUMN "relationship_stage" SET DEFAULT 'CUSTOMER';

-- CreateTable
CREATE TABLE "company_addresses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    "zip_code" VARCHAR(8),
    "street" VARCHAR(255),
    "number" VARCHAR(20),
    "complement" VARCHAR(150),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_addresses_company_id_idx" ON "company_addresses"("company_id");

-- CreateIndex
CREATE INDEX "company_addresses_type_idx" ON "company_addresses"("type");

-- CreateIndex
CREATE INDEX "company_addresses_city_state_idx" ON "company_addresses"("city", "state");

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
