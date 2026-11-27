/*
  Warnings:

  - You are about to drop the column `whatsapp` on the `provider_contacts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "provider_contacts" DROP COLUMN "whatsapp";

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "phone" VARCHAR(20);
