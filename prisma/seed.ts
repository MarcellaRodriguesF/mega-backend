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

// Remove os vínculos entre perfis e permissões
// e depois remove todas as permissões cadastradas.
// await prisma.$transaction([
//   prisma.profilePermission.deleteMany(),
//   prisma.permission.deleteMany(),
// ]);

const main = async () => {
  console.log("Iniciando seed...");

  // ==========================================
  // PERFIS DE ACESSO
  // ==========================================

  const administratorProfile = await prisma.accessProfile.upsert({
    where: { name: "ADMINISTRADOR" },
    update: {},
    create: {
      name: "ADMINISTRADOR",
      description: "Acesso administrativo do sistema",
      status: "ACTIVE",
    },
  });

  const engineerProfile = await prisma.accessProfile.upsert({
    where: { name: "ENGENHEIRO" },
    update: {},
    create: {
      name: "ENGENHEIRO",
      description: "Acesso para acompanhamento e gestão operacional",
      status: "ACTIVE",
    },
  });

  const executorProfile = await prisma.accessProfile.upsert({
    where: { name: "EXECUTOR" },
    update: {},
    create: {
      name: "EXECUTOR",
      description: "Acesso para execução e atualização das atividades",
      status: "ACTIVE",
    },
  });

  // ==========================================
  // PERMISSÕES DOS MÓDULOS
  // ==========================================

  const permissions = [
    {
      code: "DASHBOARD_ACCESS",
      name: "Acessar dashboard",
      description: "Permite acessar o dashboard operacional",
      module: "DASHBOARD",
    },
    {
      code: "CLIENTS_ACCESS",
      name: "Acessar clientes",
      description: "Permite acessar o módulo de clientes",
      module: "CLIENTS",
    },
    {
      code: "UNITS_ACCESS",
      name: "Acessar usinas",
      description: "Permite acessar o módulo de usinas",
      module: "UNITS",
    },
    {
      code: "IMPLEMENTATIONS_ACCESS",
      name: "Visualizar implantações",
      description: "Permite consultar o módulo de implantações",
      module: "IMPLEMENTATIONS",
    },
    {
      code: "IMPLEMENTATIONS_CREATE",
      name: "Criar implantações",
      description: "Permite criar implantações",
      module: "IMPLEMENTATIONS",
    },
    {
      code: "IMPLEMENTATIONS_UPDATE",
      name: "Editar implantações",
      description: "Permite editar implantações",
      module: "IMPLEMENTATIONS",
    },
    {
      code: "IMPLEMENTATIONS_CANCEL",
      name: "Cancelar implantações",
      description: "Permite cancelar implantações",
      module: "IMPLEMENTATIONS",
    },
    {
      code: "IMPLEMENTATIONS_MANAGE_STAGES",
      name: "Gerenciar etapas",
      description: "Permite criar, editar, reordenar e remover etapas da implantação",
      module: "IMPLEMENTATIONS",
    },
    {
      code: "ACTIVITIES_ACCESS",
      name: "Visualizar atividades",
      description: "Permite consultar atividades operacionais",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_CREATE",
      name: "Criar atividades",
      description: "Permite criar atividades operacionais",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_UPDATE",
      name: "Editar atividades",
      description: "Permite editar dados cadastrais da atividade",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_ASSIGN",
      name: "Atribuir responsáveis",
      description: "Permite atribuir supervisor e executores",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_EXECUTE",
      name: "Executar atividades",
      description: "Permite executar uma atividade quando o usuário é executor",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_SUPERVISE",
      name: "Supervisionar atividades",
      description: "Permite revisar uma atividade quando o usuário é supervisor",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_COMPLETE",
      name: "Concluir atividades",
      description: "Permite concluir uma atividade quando o usuário é supervisor",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_APPROVE",
      name: "Aprovar atividades",
      description: "Permite registrar a aprovação de engenheiro",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_LINK",
      name: "Vincular atividades",
      description: "Permite vincular, mover ou retirar atividades de uma implantação",
      module: "ACTIVITIES",
    },
    {
      code: "ACTIVITIES_MANAGE",
      name: "Gerenciar todas as atividades",
      description: "Permite atuar em qualquer atividade sem estar atribuído",
      module: "ACTIVITIES",
    },
    {
      code: "PROVIDERS_ACCESS",
      name: "Acessar provedores",
      description: "Permite acessar o módulo de provedores",
      module: "PROVIDERS",
    },
    {
      code: "TECHNICIANS_ACCESS",
      name: "Acessar técnicos",
      description: "Permite acessar o módulo de técnicos",
      module: "TECHNICIANS",
    },
    {
      code: "OCCURRENCES_ACCESS",
      name: "Acessar chamados",
      description: "Permite acessar o módulo de chamados",
      module: "OCCURRENCES",
    },
    {
      code: "REPORTS_ACCESS",
      name: "Acessar relatórios",
      description: "Permite acessar o módulo de relatórios",
      module: "REPORTS",
    },
    {
      code: "SETTINGS_ACCESS",
      name: "Acessar configurações",
      description: "Permite acessar as configurações do sistema",
      module: "SETTINGS",
    },
    {
      code: "USERS_ACCESS",
      name: "Acessar usuários",
      description: "Permite acessar o módulo de usuários",
      module: "USERS",
    },
    {
      code: "ACCESS_PROFILES_ACCESS",
      name: "Acessar perfis e permissões",
      description: "Permite acessar a gestão de perfis e permissões",
      module: "ACCESS_PROFILES",
    },
  ];

  const createdPermissions = [];

  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: {
        code: permission.code,
      },
      update: {
        name: permission.name,
        description: permission.description,
        module: permission.module,
      },
      create: permission,
    });

    createdPermissions.push(createdPermission);
  }

  // ==========================================
  // PERMISSÕES DO ADMINISTRADOR
  // ==========================================

  const administratorPermissionCodes = permissions.map(
    (permission) => permission.code,
  );

  // ==========================================
  // PERMISSÕES DO ENGENHEIRO
  // ==========================================

  const engineerPermissionCodes = [
    "DASHBOARD_ACCESS",
    "CLIENTS_ACCESS",
    "UNITS_ACCESS",
    "IMPLEMENTATIONS_ACCESS",
    "IMPLEMENTATIONS_CREATE",
    "IMPLEMENTATIONS_UPDATE",
    "IMPLEMENTATIONS_MANAGE_STAGES",
    "ACTIVITIES_ACCESS",
    "ACTIVITIES_CREATE",
    "ACTIVITIES_UPDATE",
    "ACTIVITIES_ASSIGN",
    "ACTIVITIES_EXECUTE",
    "ACTIVITIES_SUPERVISE",
    "ACTIVITIES_COMPLETE",
    "ACTIVITIES_APPROVE",
    "ACTIVITIES_LINK",
    "PROVIDERS_ACCESS",
    "TECHNICIANS_ACCESS",
    "OCCURRENCES_ACCESS",
    "REPORTS_ACCESS",
  ];

  // ==========================================
  // PERMISSÕES DO EXECUTOR
  // ==========================================

  const executorPermissionCodes = [
    "DASHBOARD_ACCESS",
    "UNITS_ACCESS",
    "IMPLEMENTATIONS_ACCESS",
    "ACTIVITIES_ACCESS",
    "ACTIVITIES_EXECUTE",
    "OCCURRENCES_ACCESS",
  ];

  // ==========================================
  // VINCULAR PERMISSÕES AOS PERFIS
  // ==========================================

  const profilePermissions = [
    {
      profileId: administratorProfile.id,
      permissionCodes: administratorPermissionCodes,
    },
    {
      profileId: engineerProfile.id,
      permissionCodes: engineerPermissionCodes,
    },
    {
      profileId: executorProfile.id,
      permissionCodes: executorPermissionCodes,
    },
  ];

  for (const profile of profilePermissions) {
    for (const permission of createdPermissions) {
      if (!profile.permissionCodes.includes(permission.code)) {
        continue;
      }

      await prisma.profilePermission.upsert({
        where: {
          accessProfileId_permissionId: {
            accessProfileId: profile.profileId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          accessProfileId: profile.profileId,
          permissionId: permission.id,
        },
      });
    }
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
