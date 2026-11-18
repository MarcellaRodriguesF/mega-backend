-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_contacts" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "role" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_documents" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100),
    "size_bytes" INTEGER,
    "expires_at" DATE,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_addresses" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "zip_code" VARCHAR(8),
    "street" VARCHAR(255),
    "number" VARCHAR(20),
    "complement" VARCHAR(150),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "area_type" VARCHAR(20) NOT NULL DEFAULT 'URBAN',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_documents" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100),
    "size_bytes" INTEGER,
    "expires_at" DATE,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_connectivities" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "provider_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "technology" VARCHAR(100) NOT NULL,
    "download_capacity_mbps" DOUBLE PRECISION,
    "upload_capacity_mbps" DOUBLE PRECISION,
    "response_time_ms" DOUBLE PRECISION,
    "throughput_mbps" DOUBLE PRECISION,
    "rx_signal_dbm" DOUBLE PRECISION,
    "public_ip" VARCHAR(45),
    "gateway_ip" VARCHAR(45),
    "local_ip" VARCHAR(45),
    "sla_percentage" DOUBLE PRECISION,
    "mttr_hours" DOUBLE PRECISION,
    "network_name" VARCHAR(150),
    "wan_ip" VARCHAR(45),
    "monitoring_enabled" BOOLEAN NOT NULL DEFAULT false,
    "service_start_date" DATE,
    "service_end_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_connectivities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "providers_name_idx" ON "providers"("name");

-- CreateIndex
CREATE INDEX "providers_status_idx" ON "providers"("status");

-- CreateIndex
CREATE INDEX "provider_contacts_provider_id_idx" ON "provider_contacts"("provider_id");

-- CreateIndex
CREATE INDEX "provider_documents_provider_id_idx" ON "provider_documents"("provider_id");

-- CreateIndex
CREATE INDEX "provider_documents_type_idx" ON "provider_documents"("type");

-- CreateIndex
CREATE INDEX "provider_documents_expires_at_idx" ON "provider_documents"("expires_at");

-- CreateIndex
CREATE INDEX "units_company_id_idx" ON "units"("company_id");

-- CreateIndex
CREATE INDEX "units_name_idx" ON "units"("name");

-- CreateIndex
CREATE INDEX "units_type_idx" ON "units"("type");

-- CreateIndex
CREATE INDEX "units_status_idx" ON "units"("status");

-- CreateIndex
CREATE UNIQUE INDEX "unit_addresses_unit_id_key" ON "unit_addresses"("unit_id");

-- CreateIndex
CREATE INDEX "unit_addresses_city_state_idx" ON "unit_addresses"("city", "state");

-- CreateIndex
CREATE INDEX "unit_documents_unit_id_idx" ON "unit_documents"("unit_id");

-- CreateIndex
CREATE INDEX "unit_documents_type_idx" ON "unit_documents"("type");

-- CreateIndex
CREATE INDEX "unit_documents_expires_at_idx" ON "unit_documents"("expires_at");

-- CreateIndex
CREATE INDEX "unit_connectivities_unit_id_idx" ON "unit_connectivities"("unit_id");

-- CreateIndex
CREATE INDEX "unit_connectivities_provider_id_idx" ON "unit_connectivities"("provider_id");

-- CreateIndex
CREATE INDEX "unit_connectivities_technology_idx" ON "unit_connectivities"("technology");

-- CreateIndex
CREATE INDEX "unit_connectivities_status_idx" ON "unit_connectivities"("status");

-- AddForeignKey
ALTER TABLE "provider_contacts" ADD CONSTRAINT "provider_contacts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_addresses" ADD CONSTRAINT "unit_addresses_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_documents" ADD CONSTRAINT "unit_documents_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_connectivities" ADD CONSTRAINT "unit_connectivities_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_connectivities" ADD CONSTRAINT "unit_connectivities_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
