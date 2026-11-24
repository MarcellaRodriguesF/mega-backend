-- CreateEnum
CREATE TYPE "template_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "activity_requirement_type" AS ENUM ('EVIDENCE', 'FORM', 'QUANTITY', 'COMMENT', 'ENGINEER_APPROVAL', 'DAILY_REPORT', 'COMPLETION_PERCENTAGE');

-- CreateEnum
CREATE TYPE "form_field_type" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SINGLE_SELECT', 'MULTIPLE_SELECT', 'CHECKBOX', 'FILE');

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "template_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_stages" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_activities" (
    "id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_requirements" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "type" "activity_requirement_type" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "configuration" JSONB,
    "form_template_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_requirement_evidence_types" (
    "id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_requirement_evidence_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" UUID NOT NULL,
    "form_template_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "form_field_type" NOT NULL,
    "placeholder" VARCHAR(255),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_name_idx" ON "templates"("name");

-- CreateIndex
CREATE INDEX "templates_status_idx" ON "templates"("status");

-- CreateIndex
CREATE INDEX "template_stages_template_id_idx" ON "template_stages"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_stages_template_id_order_key" ON "template_stages"("template_id", "order");

-- CreateIndex
CREATE INDEX "template_activities_stage_id_idx" ON "template_activities"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_activities_stage_id_order_key" ON "template_activities"("stage_id", "order");

-- CreateIndex
CREATE INDEX "activity_requirements_activity_id_idx" ON "activity_requirements"("activity_id");

-- CreateIndex
CREATE INDEX "activity_requirements_form_template_id_idx" ON "activity_requirements"("form_template_id");

-- CreateIndex
CREATE INDEX "activity_requirements_type_idx" ON "activity_requirements"("type");

-- CreateIndex
CREATE UNIQUE INDEX "activity_requirements_activity_id_order_key" ON "activity_requirements"("activity_id", "order");

-- CreateIndex
CREATE INDEX "activity_requirement_evidence_types_requirement_id_idx" ON "activity_requirement_evidence_types"("requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_requirement_evidence_types_requirement_id_type_key" ON "activity_requirement_evidence_types"("requirement_id", "type");

-- CreateIndex
CREATE INDEX "form_templates_name_idx" ON "form_templates"("name");

-- CreateIndex
CREATE INDEX "form_templates_status_idx" ON "form_templates"("status");

-- CreateIndex
CREATE INDEX "form_fields_form_template_id_idx" ON "form_fields"("form_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_form_template_id_key_key" ON "form_fields"("form_template_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_form_template_id_order_key" ON "form_fields"("form_template_id", "order");

-- AddForeignKey
ALTER TABLE "template_stages" ADD CONSTRAINT "template_stages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_activities" ADD CONSTRAINT "template_activities_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "template_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_requirements" ADD CONSTRAINT "activity_requirements_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "template_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_requirements" ADD CONSTRAINT "activity_requirements_form_template_id_fkey" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_requirement_evidence_types" ADD CONSTRAINT "activity_requirement_evidence_types_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "activity_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_template_id_fkey" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
