-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "corporate_name" VARCHAR(255),
    "trade_name" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(14),
    "zip_code" VARCHAR(8),
    "street" VARCHAR(255),
    "number" VARCHAR(20),
    "complement" VARCHAR(150),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "relationship_stage" VARCHAR(20) NOT NULL DEFAULT 'LEAD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contacts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "role" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "owner_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "estimated_value" DECIMAL(14,2),
    "stage" VARCHAR(30) NOT NULL DEFAULT 'QUALIFICATION',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "probability" SMALLINT,
    "expected_close_date" DATE,
    "lost_reason" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE INDEX "companies_corporate_name_idx" ON "companies"("corporate_name");

-- CreateIndex
CREATE INDEX "companies_trade_name_idx" ON "companies"("trade_name");

-- CreateIndex
CREATE INDEX "companies_relationship_stage_idx" ON "companies"("relationship_stage");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "company_contacts_company_id_idx" ON "company_contacts"("company_id");

-- CreateIndex
CREATE INDEX "opportunities_company_id_idx" ON "opportunities"("company_id");

-- CreateIndex
CREATE INDEX "opportunities_owner_id_idx" ON "opportunities"("owner_id");

-- CreateIndex
CREATE INDEX "opportunities_stage_idx" ON "opportunities"("stage");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
