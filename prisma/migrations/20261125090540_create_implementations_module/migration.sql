-- CreateEnum
CREATE TYPE "implementation_status" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "implementation_work_status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "implementation_assignment_role" AS ENUM ('EXECUTION', 'COMPLETION');

-- CreateEnum
CREATE TYPE "connectivity_field_target" AS ENUM ('PROVIDER_ID', 'TECHNOLOGY', 'DOWNLOAD_CAPACITY_MBPS', 'UPLOAD_CAPACITY_MBPS', 'RESPONSE_TIME_MS', 'THROUGHPUT_MBPS', 'RX_SIGNAL_DBM', 'PUBLIC_IP', 'GATEWAY_IP', 'LOCAL_IP', 'WAN_IP', 'NETWORK_NAME', 'SLA_PERCENTAGE', 'MTTR_HOURS', 'MONITORING_ENABLED', 'SERVICE_START_DATE', 'SERVICE_END_DATE', 'OBSERVATIONS', 'CONNECTIVITY_NAME');

-- CreateTable
CREATE TABLE "implementations" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "template_id" UUID,
    "status" "implementation_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "template_name" VARCHAR(255) NOT NULL,
    "template_description" TEXT,
    "unit_name" VARCHAR(255) NOT NULL,
    "company_trade_name" VARCHAR(255) NOT NULL,
    "address_zip_code" VARCHAR(8),
    "address_street" VARCHAR(255),
    "address_number" VARCHAR(20),
    "address_complement" VARCHAR(150),
    "address_neighborhood" VARCHAR(100),
    "address_city" VARCHAR(100),
    "address_state" VARCHAR(2),
    "initial_provider_id" UUID,
    "initial_provider_name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_stages" (
    "id" UUID NOT NULL,
    "implementation_id" UUID NOT NULL,
    "source_stage_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "implementation_work_status" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_activities" (
    "id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "source_activity_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "implementation_work_status" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_activity_assignments" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_name" VARCHAR(150) NOT NULL,
    "role" "implementation_assignment_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "implementation_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_requirements" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "source_requirement_id" UUID,
    "type" "activity_requirement_type" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "configuration" JSONB,
    "form_snapshot_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_requirement_evidence_types" (
    "id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_requirement_evidence_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_form_snapshots" (
    "id" UUID NOT NULL,
    "implementation_id" UUID NOT NULL,
    "source_form_template_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_form_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_form_fields" (
    "id" UUID NOT NULL,
    "form_snapshot_id" UUID NOT NULL,
    "source_form_field_id" UUID,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "form_field_type" NOT NULL,
    "placeholder" VARCHAR(255),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "options" JSONB,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "connectivity_field_target" "connectivity_field_target",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "implementations_unit_id_idx" ON "implementations"("unit_id");

-- CreateIndex
CREATE INDEX "implementations_company_id_idx" ON "implementations"("company_id");

-- CreateIndex
CREATE INDEX "implementations_template_id_idx" ON "implementations"("template_id");

-- CreateIndex
CREATE INDEX "implementations_status_idx" ON "implementations"("status");

-- CreateIndex
CREATE INDEX "implementations_initial_provider_id_idx" ON "implementations"("initial_provider_id");

-- CreateIndex
CREATE INDEX "implementations_started_at_idx" ON "implementations"("started_at");

-- CreateIndex
CREATE INDEX "implementation_stages_implementation_id_idx" ON "implementation_stages"("implementation_id");

-- CreateIndex
CREATE INDEX "implementation_stages_source_stage_id_idx" ON "implementation_stages"("source_stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_stages_implementation_id_order_key" ON "implementation_stages"("implementation_id", "order");

-- CreateIndex
CREATE INDEX "implementation_activities_stage_id_idx" ON "implementation_activities"("stage_id");

-- CreateIndex
CREATE INDEX "implementation_activities_source_activity_id_idx" ON "implementation_activities"("source_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_activities_stage_id_order_key" ON "implementation_activities"("stage_id", "order");

-- CreateIndex
CREATE INDEX "implementation_activity_assignments_activity_id_idx" ON "implementation_activity_assignments"("activity_id");

-- CreateIndex
CREATE INDEX "implementation_activity_assignments_user_id_idx" ON "implementation_activity_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_activity_assignments_activity_id_user_id_rol_key" ON "implementation_activity_assignments"("activity_id", "user_id", "role");

-- CreateIndex
CREATE INDEX "implementation_requirements_activity_id_idx" ON "implementation_requirements"("activity_id");

-- CreateIndex
CREATE INDEX "implementation_requirements_source_requirement_id_idx" ON "implementation_requirements"("source_requirement_id");

-- CreateIndex
CREATE INDEX "implementation_requirements_form_snapshot_id_idx" ON "implementation_requirements"("form_snapshot_id");

-- CreateIndex
CREATE INDEX "implementation_requirements_type_idx" ON "implementation_requirements"("type");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_requirements_activity_id_order_key" ON "implementation_requirements"("activity_id", "order");

-- CreateIndex
CREATE INDEX "implementation_requirement_evidence_types_requirement_id_idx" ON "implementation_requirement_evidence_types"("requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_requirement_evidence_types_requirement_id_ty_key" ON "implementation_requirement_evidence_types"("requirement_id", "type");

-- CreateIndex
CREATE INDEX "implementation_form_snapshots_implementation_id_idx" ON "implementation_form_snapshots"("implementation_id");

-- CreateIndex
CREATE INDEX "implementation_form_snapshots_source_form_template_id_idx" ON "implementation_form_snapshots"("source_form_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_form_snapshots_implementation_id_source_form_key" ON "implementation_form_snapshots"("implementation_id", "source_form_template_id");

-- CreateIndex
CREATE INDEX "implementation_form_fields_form_snapshot_id_idx" ON "implementation_form_fields"("form_snapshot_id");

-- CreateIndex
CREATE INDEX "implementation_form_fields_source_form_field_id_idx" ON "implementation_form_fields"("source_form_field_id");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_form_fields_form_snapshot_id_key_key" ON "implementation_form_fields"("form_snapshot_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "implementation_form_fields_form_snapshot_id_order_key" ON "implementation_form_fields"("form_snapshot_id", "order");

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_initial_provider_id_fkey" FOREIGN KEY ("initial_provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_stages" ADD CONSTRAINT "implementation_stages_implementation_id_fkey" FOREIGN KEY ("implementation_id") REFERENCES "implementations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_stages" ADD CONSTRAINT "implementation_stages_source_stage_id_fkey" FOREIGN KEY ("source_stage_id") REFERENCES "template_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_activities" ADD CONSTRAINT "implementation_activities_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "implementation_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_activities" ADD CONSTRAINT "implementation_activities_source_activity_id_fkey" FOREIGN KEY ("source_activity_id") REFERENCES "template_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_activity_assignments" ADD CONSTRAINT "implementation_activity_assignments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "implementation_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_activity_assignments" ADD CONSTRAINT "implementation_activity_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_requirements" ADD CONSTRAINT "implementation_requirements_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "implementation_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_requirements" ADD CONSTRAINT "implementation_requirements_source_requirement_id_fkey" FOREIGN KEY ("source_requirement_id") REFERENCES "activity_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_requirements" ADD CONSTRAINT "implementation_requirements_form_snapshot_id_fkey" FOREIGN KEY ("form_snapshot_id") REFERENCES "implementation_form_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_requirement_evidence_types" ADD CONSTRAINT "implementation_requirement_evidence_types_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "implementation_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_form_snapshots" ADD CONSTRAINT "implementation_form_snapshots_implementation_id_fkey" FOREIGN KEY ("implementation_id") REFERENCES "implementations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_form_snapshots" ADD CONSTRAINT "implementation_form_snapshots_source_form_template_id_fkey" FOREIGN KEY ("source_form_template_id") REFERENCES "form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_form_fields" ADD CONSTRAINT "implementation_form_fields_form_snapshot_id_fkey" FOREIGN KEY ("form_snapshot_id") REFERENCES "implementation_form_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_form_fields" ADD CONSTRAINT "implementation_form_fields_source_form_field_id_fkey" FOREIGN KEY ("source_form_field_id") REFERENCES "form_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;
