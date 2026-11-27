-- Implantação passa a ter nome próprio. Cliente, unidade e template ficam opcionais.
ALTER TABLE "implementations" ADD COLUMN "name" VARCHAR(255);
ALTER TABLE "implementations" ADD COLUMN "description" TEXT;

UPDATE "implementations"
SET "name" = LEFT(
  COALESCE(NULLIF("template_name", ''), NULLIF("unit_name", ''), 'Implantação'),
  255
);

ALTER TABLE "implementations" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "implementations" ALTER COLUMN "unit_id" DROP NOT NULL;
ALTER TABLE "implementations" ALTER COLUMN "company_id" DROP NOT NULL;
ALTER TABLE "implementations" ALTER COLUMN "template_name" DROP NOT NULL;
ALTER TABLE "implementations" ALTER COLUMN "unit_name" DROP NOT NULL;
ALTER TABLE "implementations" ALTER COLUMN "company_trade_name" DROP NOT NULL;

CREATE INDEX "implementations_name_idx" ON "implementations"("name");

-- Papéis existentes são preservados, apenas com a nomenclatura nova.
ALTER TYPE "implementation_assignment_role" RENAME VALUE 'EXECUTION' TO 'EXECUTOR';
ALTER TYPE "implementation_assignment_role" RENAME VALUE 'COMPLETION' TO 'SUPERVISOR';

-- A atividade deixa de depender de uma etapa obrigatória.
ALTER TABLE "implementation_activities" ADD COLUMN "implementation_id" UUID;
ALTER TABLE "implementation_activities" ADD COLUMN "company_id" UUID;
ALTER TABLE "implementation_activities" ADD COLUMN "unit_id" UUID;
ALTER TABLE "implementation_activities" ADD COLUMN "unit_name" VARCHAR(255);
ALTER TABLE "implementation_activities" ADD COLUMN "company_trade_name" VARCHAR(255);
ALTER TABLE "implementation_activities" ADD COLUMN "address_zip_code" VARCHAR(8);
ALTER TABLE "implementation_activities" ADD COLUMN "address_street" VARCHAR(255);
ALTER TABLE "implementation_activities" ADD COLUMN "address_number" VARCHAR(20);
ALTER TABLE "implementation_activities" ADD COLUMN "address_complement" VARCHAR(150);
ALTER TABLE "implementation_activities" ADD COLUMN "address_neighborhood" VARCHAR(100);
ALTER TABLE "implementation_activities" ADD COLUMN "address_city" VARCHAR(100);
ALTER TABLE "implementation_activities" ADD COLUMN "address_state" VARCHAR(2);
ALTER TABLE "implementation_activities" ADD COLUMN "initial_provider_id" UUID;
ALTER TABLE "implementation_activities" ADD COLUMN "initial_provider_name" VARCHAR(255);

UPDATE "implementation_activities" AS activity
SET "implementation_id" = stage."implementation_id"
FROM "implementation_stages" AS stage
WHERE stage."id" = activity."stage_id";

UPDATE "implementation_activities" AS activity
SET
  "company_id" = implementation."company_id",
  "unit_id" = implementation."unit_id",
  "unit_name" = implementation."unit_name",
  "company_trade_name" = implementation."company_trade_name",
  "address_zip_code" = implementation."address_zip_code",
  "address_street" = implementation."address_street",
  "address_number" = implementation."address_number",
  "address_complement" = implementation."address_complement",
  "address_neighborhood" = implementation."address_neighborhood",
  "address_city" = implementation."address_city",
  "address_state" = implementation."address_state",
  "initial_provider_id" = implementation."initial_provider_id",
  "initial_provider_name" = implementation."initial_provider_name"
FROM "implementations" AS implementation
WHERE implementation."id" = activity."implementation_id";

ALTER TABLE "implementation_activities" ALTER COLUMN "stage_id" DROP NOT NULL;

ALTER TABLE "implementation_activities" RENAME TO "activities";

ALTER TABLE "activities" DROP CONSTRAINT "implementation_activities_stage_id_fkey";
ALTER TABLE "activities" DROP CONSTRAINT "implementation_activities_source_activity_id_fkey";
DROP INDEX "implementation_activities_stage_id_order_key";
DROP INDEX "implementation_activities_stage_id_idx";
DROP INDEX "implementation_activities_source_activity_id_idx";

ALTER TABLE "activities"
ADD CONSTRAINT "activities_implementation_id_fkey"
FOREIGN KEY ("implementation_id") REFERENCES "implementations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_stage_id_fkey"
FOREIGN KEY ("stage_id") REFERENCES "implementation_stages"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_source_activity_id_fkey"
FOREIGN KEY ("source_activity_id") REFERENCES "template_activities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_unit_id_fkey"
FOREIGN KEY ("unit_id") REFERENCES "units"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_initial_provider_id_fkey"
FOREIGN KEY ("initial_provider_id") REFERENCES "providers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_stage_requires_implementation"
CHECK ("stage_id" IS NULL OR "implementation_id" IS NOT NULL);

CREATE INDEX "activities_implementation_id_idx" ON "activities"("implementation_id");
CREATE INDEX "activities_stage_id_idx" ON "activities"("stage_id");
CREATE INDEX "activities_company_id_idx" ON "activities"("company_id");
CREATE INDEX "activities_unit_id_idx" ON "activities"("unit_id");
CREATE INDEX "activities_source_activity_id_idx" ON "activities"("source_activity_id");
CREATE INDEX "activities_initial_provider_id_idx" ON "activities"("initial_provider_id");
CREATE INDEX "activities_status_idx" ON "activities"("status");
CREATE UNIQUE INDEX "activities_stage_order_uidx"
ON "activities"("stage_id", "order")
WHERE "stage_id" IS NOT NULL;
CREATE UNIQUE INDEX "activities_direct_order_uidx"
ON "activities"("implementation_id", "order")
WHERE "stage_id" IS NULL AND "implementation_id" IS NOT NULL;

CREATE OR REPLACE FUNCTION activities_enforce_stage_implementation()
RETURNS trigger AS $$
DECLARE
  stage_implementation UUID;
BEGIN
  IF NEW."stage_id" IS NOT NULL THEN
    SELECT "implementation_id" INTO stage_implementation
    FROM "implementation_stages"
    WHERE "id" = NEW."stage_id";

    IF stage_implementation IS NULL OR stage_implementation IS DISTINCT FROM NEW."implementation_id" THEN
      RAISE EXCEPTION 'A etapa não pertence à implantação da atividade';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "activities_stage_implementation_trg"
BEFORE INSERT OR UPDATE OF "stage_id", "implementation_id" ON "activities"
FOR EACH ROW EXECUTE FUNCTION activities_enforce_stage_implementation();

ALTER TABLE "implementation_activity_assignments" RENAME TO "activity_assignments";
ALTER INDEX "implementation_activity_assignments_activity_id_user_id_rol_key"
RENAME TO "activity_assignments_activity_id_user_id_role_key";
ALTER INDEX "implementation_activity_assignments_activity_id_idx"
RENAME TO "activity_assignments_activity_id_idx";
ALTER INDEX "implementation_activity_assignments_user_id_idx"
RENAME TO "activity_assignments_user_id_idx";
ALTER TABLE "activity_assignments"
RENAME CONSTRAINT "implementation_activity_assignments_pkey" TO "activity_assignments_pkey";
ALTER TABLE "activity_assignments"
RENAME CONSTRAINT "implementation_activity_assignments_activity_id_fkey" TO "activity_assignments_activity_id_fkey";
ALTER TABLE "activity_assignments"
RENAME CONSTRAINT "implementation_activity_assignments_user_id_fkey" TO "activity_assignments_user_id_fkey";

CREATE UNIQUE INDEX "activity_assignments_one_supervisor_uidx"
ON "activity_assignments"("activity_id")
WHERE "role" = 'SUPERVISOR';

-- O snapshot do formulário passa a pertencer à atividade, com uma cópia por atividade.
ALTER TABLE "implementation_form_snapshots" ADD COLUMN "activity_id" UUID;
ALTER TABLE "implementation_form_snapshots" ALTER COLUMN "implementation_id" DROP NOT NULL;
DROP INDEX "implementation_form_snapshots_implementation_id_source_form_key";

WITH usage AS (
  SELECT
    "form_snapshot_id",
    (MIN("activity_id"::text))::uuid AS "activity_id",
    COUNT(DISTINCT "activity_id") AS "activity_count"
  FROM "implementation_requirements"
  WHERE "form_snapshot_id" IS NOT NULL
  GROUP BY "form_snapshot_id"
)
UPDATE "implementation_form_snapshots" AS snapshot
SET "activity_id" = usage."activity_id"
FROM usage
WHERE snapshot."id" = usage."form_snapshot_id"
  AND usage."activity_count" = 1;

DO $$
DECLARE
  rec RECORD;
  new_snapshot UUID;
  field_rec RECORD;
  new_field UUID;
BEGIN
  FOR rec IN
    SELECT requirement."form_snapshot_id", requirement."activity_id"
    FROM "implementation_requirements" AS requirement
    JOIN "implementation_form_snapshots" AS snapshot
      ON snapshot."id" = requirement."form_snapshot_id"
    WHERE snapshot."activity_id" IS DISTINCT FROM requirement."activity_id"
    GROUP BY requirement."form_snapshot_id", requirement."activity_id"
  LOOP
    new_snapshot := gen_random_uuid();

    INSERT INTO "implementation_form_snapshots" (
      "id",
      "implementation_id",
      "activity_id",
      "source_form_template_id",
      "name",
      "description",
      "status",
      "created_at",
      "updated_at"
    )
    SELECT
      new_snapshot,
      NULL,
      rec."activity_id",
      "source_form_template_id",
      "name",
      "description",
      "status",
      "created_at",
      NOW()
    FROM "implementation_form_snapshots"
    WHERE "id" = rec."form_snapshot_id";

    FOR field_rec IN
      SELECT * FROM "implementation_form_fields" WHERE "form_snapshot_id" = rec."form_snapshot_id"
    LOOP
      new_field := gen_random_uuid();
      INSERT INTO "implementation_form_fields" (
        "id",
        "form_snapshot_id",
        "source_form_field_id",
        "key",
        "label",
        "description",
        "type",
        "placeholder",
        "is_required",
        "order",
        "options",
        "is_sensitive",
        "connectivity_field_target",
        "created_at",
        "updated_at"
      ) VALUES (
        new_field,
        new_snapshot,
        field_rec."source_form_field_id",
        field_rec."key",
        field_rec."label",
        field_rec."description",
        field_rec."type",
        field_rec."placeholder",
        field_rec."is_required",
        field_rec."order",
        field_rec."options",
        field_rec."is_sensitive",
        field_rec."connectivity_field_target",
        field_rec."created_at",
        NOW()
      );
    END LOOP;

    UPDATE "implementation_requirements"
    SET "form_snapshot_id" = new_snapshot
    WHERE "form_snapshot_id" = rec."form_snapshot_id"
      AND "activity_id" = rec."activity_id";
  END LOOP;
END $$;

UPDATE "implementation_form_snapshots" AS snapshot
SET "activity_id" = (
  SELECT activity."id"
  FROM "activities" AS activity
  WHERE activity."implementation_id" = snapshot."implementation_id"
  ORDER BY activity."created_at"
  LIMIT 1
)
WHERE snapshot."activity_id" IS NULL
  AND snapshot."implementation_id" IS NOT NULL;

DELETE FROM "implementation_form_fields"
WHERE "form_snapshot_id" IN (
  SELECT "id" FROM "implementation_form_snapshots" WHERE "activity_id" IS NULL
);

DELETE FROM "implementation_form_snapshots" WHERE "activity_id" IS NULL;

ALTER TABLE "implementation_form_snapshots" DROP CONSTRAINT "implementation_form_snapshots_implementation_id_fkey";
DROP INDEX "implementation_form_snapshots_implementation_id_idx";
ALTER TABLE "implementation_form_snapshots" DROP COLUMN "implementation_id";
ALTER TABLE "implementation_form_snapshots" ALTER COLUMN "activity_id" SET NOT NULL;

ALTER TABLE "implementation_form_snapshots"
ADD CONSTRAINT "implementation_form_snapshots_activity_id_fkey"
FOREIGN KEY ("activity_id") REFERENCES "activities"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "implementation_form_snapshots_activity_id_idx"
ON "implementation_form_snapshots"("activity_id");

CREATE UNIQUE INDEX "implementation_form_snapshots_activity_id_source_form_key"
ON "implementation_form_snapshots"("activity_id", "source_form_template_id");

CREATE TABLE "activity_placements" (
  "id" UUID NOT NULL,
  "activity_id" UUID NOT NULL,
  "from_implementation_id" UUID,
  "to_implementation_id" UUID,
  "from_stage_id" UUID,
  "to_stage_id" UUID,
  "from_implementation_name" VARCHAR(255),
  "to_implementation_name" VARCHAR(255),
  "from_stage_name" VARCHAR(255),
  "to_stage_name" VARCHAR(255),
  "user_id" UUID NOT NULL,
  "user_name" VARCHAR(150) NOT NULL,
  "reason" TEXT,
  "explicit_confirmation" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_placements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_placements_activity_id_idx" ON "activity_placements"("activity_id");
CREATE INDEX "activity_placements_user_id_idx" ON "activity_placements"("user_id");

ALTER TABLE "activity_placements"
ADD CONSTRAINT "activity_placements_activity_id_fkey"
FOREIGN KEY ("activity_id") REFERENCES "activities"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "activity_evidences" (
  "id" UUID NOT NULL,
  "activity_id" UUID NOT NULL,
  "requirement_id" UUID,
  "evidence_type" VARCHAR(50) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "storage_key" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_evidences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_evidences_activity_id_idx" ON "activity_evidences"("activity_id");
CREATE INDEX "activity_evidences_requirement_id_idx" ON "activity_evidences"("requirement_id");

ALTER TABLE "activity_evidences"
ADD CONSTRAINT "activity_evidences_activity_id_fkey"
FOREIGN KEY ("activity_id") REFERENCES "activities"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_evidences"
ADD CONSTRAINT "activity_evidences_requirement_id_fkey"
FOREIGN KEY ("requirement_id") REFERENCES "implementation_requirements"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "activity_field_responses" (
  "id" UUID NOT NULL,
  "activity_id" UUID NOT NULL,
  "field_id" UUID NOT NULL,
  "value_text" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "activity_field_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "activity_field_responses_field_id_key" ON "activity_field_responses"("field_id");
CREATE INDEX "activity_field_responses_activity_id_idx" ON "activity_field_responses"("activity_id");

ALTER TABLE "activity_field_responses"
ADD CONSTRAINT "activity_field_responses_activity_id_fkey"
FOREIGN KEY ("activity_id") REFERENCES "activities"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_field_responses"
ADD CONSTRAINT "activity_field_responses_field_id_fkey"
FOREIGN KEY ("field_id") REFERENCES "implementation_form_fields"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
