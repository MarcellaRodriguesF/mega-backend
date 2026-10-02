import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não foi definida.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const main = async () => {
  console.log("Iniciando seed...");

  // ==========================================
  // PERFIS DE ACESSO
  // ==========================================

  const administratorProfile = await prisma.accessProfile.upsert({
    where: {
      name: "ADMINISTRADOR",
    },
    update: {},
    create: {
      name: "ADMINISTRADOR",
      description: "Acesso administrativo do sistema",
      status: "ACTIVE",
    },
  });

  const engineerProfile = await prisma.accessProfile.upsert({
    where: {
      name: "ENGENHEIRO",
    },
    update: {},
    create: {
      name: "ENGENHEIRO",
      description: "Acesso para acompanhamento e gestão operacional",
      status: "ACTIVE",
    },
  });

  const executorProfile = await prisma.accessProfile.upsert({
    where: {
      name: "EXECUTOR",
    },
    update: {},
    create: {
      name: "EXECUTOR",
      description: "Acesso para execução e atualização das atividades",
      status: "ACTIVE",
    },
  });

  // ==========================================
  // PERMISSÕES
  // ==========================================

  const permissions = [
    {
      code: "users.view",
      name: "Visualizar usuários",
      description: "Permite visualizar usuários",
      module: "users",
    },
    {
      code: "users.create",
      name: "Criar usuários",
      description: "Permite criar usuários",
      module: "users",
    },
    {
      code: "users.update",
      name: "Editar usuários",
      description: "Permite editar usuários",
      module: "users",
    },
    {
      code: "profiles.view",
      name: "Visualizar perfis",
      description: "Permite visualizar perfis de acesso",
      module: "profiles",
    },
    {
      code: "profiles.create",
      name: "Criar perfis",
      description: "Permite criar perfis de acesso",
      module: "profiles",
    },
    {
      code: "profiles.update",
      name: "Editar perfis",
      description: "Permite editar perfis de acesso",
      module: "profiles",
    },
    {
      code: "permissions.view",
      name: "Visualizar permissões",
      description: "Permite visualizar permissões",
      module: "permissions",
    },
    {
      code: "clients.view",
      name: "Visualizar clientes",
      description: "Permite visualizar clientes",
      module: "clients",
    },
    {
      code: "clients.create",
      name: "Criar clientes",
      description: "Permite criar clientes",
      module: "clients",
    },
    {
      code: "clients.update",
      name: "Editar clientes",
      description: "Permite editar clientes",
      module: "clients",
    },
    {
      code: "activities.view",
      name: "Visualizar atividades",
      description: "Permite visualizar atividades",
      module: "activities",
    },
    {
      code: "activities.create",
      name: "Criar atividades",
      description: "Permite criar atividades",
      module: "activities",
    },
    {
      code: "activities.update",
      name: "Editar atividades",
      description: "Permite editar atividades",
      module: "activities",
    },
    {
      code: "activities.complete",
      name: "Concluir atividades",
      description: "Permite concluir atividades",
      module: "activities",
    },
  ];

  const createdPermissions = [];

  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: {
        code: permission.code,
      },
      update: {},
      create: permission,
    });

    createdPermissions.push(createdPermission);
  }

  // ==========================================
  // PERMISSÕES DO ADMINISTRADOR
  // ==========================================

  for (const permission of createdPermissions) {
    await prisma.profilePermission.upsert({
      where: {
        accessProfileId_permissionId: {
          accessProfileId: administratorProfile.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        accessProfileId: administratorProfile.id,
        permissionId: permission.id,
      },
    });
  }

  // ==========================================
  // PERMISSÕES DO ENGENHEIRO
  // ==========================================

  const engineerPermissionCodes = [
    "users.view",
    "profiles.view",
    "permissions.view",
    "clients.view",
    "clients.create",
    "clients.update",
    "activities.view",
    "activities.create",
    "activities.update",
    "activities.complete",
  ];

  for (const permission of createdPermissions) {
    if (!engineerPermissionCodes.includes(permission.code)) {
      continue;
    }

    await prisma.profilePermission.upsert({
      where: {
        accessProfileId_permissionId: {
          accessProfileId: engineerProfile.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        accessProfileId: engineerProfile.id,
        permissionId: permission.id,
      },
    });
  }

  // ==========================================
  // PERMISSÕES DO EXECUTOR
  // ==========================================

  const executorPermissionCodes = [
    "clients.view",
    "activities.view",
    "activities.update",
    "activities.complete",
  ];

  for (const permission of createdPermissions) {
    if (!executorPermissionCodes.includes(permission.code)) {
      continue;
    }

    await prisma.profilePermission.upsert({
      where: {
        accessProfileId_permissionId: {
          accessProfileId: executorProfile.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        accessProfileId: executorProfile.id,
        permissionId: permission.id,
      },
    });
  }

  // ==========================================
  // USUÁRIO ADMINISTRADOR DE DESENVOLVIMENTO
  // ==========================================

  const passwordHash = await bcrypt.hash("Mega@123456", 12);

  await prisma.user.upsert({
    where: {
      email: "admin@mega.local",
    },
    update: {
      accessProfileId: administratorProfile.id,
      status: "ACTIVE",
    },
    create: {
      email: "admin@mega.local",
      passwordHash,
      accessProfileId: administratorProfile.id,
      status: "ACTIVE",
    },
  });

  console.log("Seed concluído com sucesso.");
};

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });