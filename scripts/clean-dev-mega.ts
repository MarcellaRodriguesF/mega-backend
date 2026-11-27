
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não foi definida.");
}

// Dupla proteção: exige confirmação explícita.
if (
  process.env.ALLOW_DESTRUCTIVE_DEV_RESET !==
  "I_UNDERSTAND_THIS_DELETES_DATA"
) {
  throw new Error(
    "Limpeza bloqueada. Defina ALLOW_DESTRUCTIVE_DEV_RESET=I_UNDERSTAND_THIS_DELETES_DATA para confirmar.",
  );
}

const parsed = new URL(connectionString);

const databaseName = decodeURIComponent(
  parsed.pathname.replace(/^\//, ""),
).toLowerCase();

const host = parsed.hostname.toLowerCase();

const looksLikeDevelopment =
  /(^|[-_])(dev|development|local|test|testing)([-_]|$)/.test(
    databaseName,
  ) ||
  ["localhost", "127.0.0.1", "::1"].includes(host);

if (!looksLikeDevelopment) {
  throw new Error(
    `Limpeza bloqueada: o banco "${databaseName}" em "${host}" não parece ser de desenvolvimento. ` +
      "Use um banco cujo nome contenha dev/local/test ou localhost.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const confirmation = process.env.DATABASE_RESET_CONFIRMATION;

  if (confirmation !== databaseName) {
    throw new Error(
      `Confirmação adicional obrigatória. Defina DATABASE_RESET_CONFIRMATION=${databaseName}`,
    );
  }

  console.warn(
    `ATENÇÃO: apagando os dados de "${databaseName}" em ${host}.`,
  );

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      activity_field_responses,
      implementation_form_fields,
      implementation_form_snapshots,
      implementation_requirement_evidence_types,
      activity_evidences,
      implementation_requirements,
      activity_placements,
      activity_assignments,
      activities,
      implementation_stages,
      implementations,
      activity_requirement_evidence_types,
      activity_requirements,
      template_activities,
      template_stages,
      templates,
      form_fields,
      form_templates,
      unit_connectivities,
      unit_documents,
      unit_addresses,
      units,
      provider_documents,
      provider_contacts,
      providers,
      company_contacts,
      company_addresses,
      opportunities,
      profile_permissions,
      permissions,
      users,
      access_profiles,
      companies
    RESTART IDENTITY CASCADE
  `);

  console.log(
    "Dados da aplicação removidos. A tabela de migrations foi preservada.",
  );
}

main()
  .catch((error) => {
    console.error("Erro ao limpar banco de desenvolvimento:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
