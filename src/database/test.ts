import { prisma } from "./prisma.js";

const main = async () => {
  const profiles = await prisma.accessProfile.findMany();

  console.log("Perfis encontrados:", profiles);
};

main()
  .catch((error) => {
    console.error("Erro ao consultar o banco:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });