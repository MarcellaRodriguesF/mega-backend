-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "order" SET DEFAULT 0;
ALTER TABLE "activities" RENAME CONSTRAINT "implementation_activities_pkey" TO "activities_pkey";

-- RenameIndex
ALTER INDEX "implementation_form_snapshots_activity_id_source_form_key" RENAME TO "implementation_form_snapshots_activity_id_source_form_templ_key";
