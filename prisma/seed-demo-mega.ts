
import "dotenv/config";
import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não foi definida.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const db = prisma as any;

// IDs determinísticos: permite executar o seed novamente sem duplicações.
function idFor(key: string) {
  const bytes = createHash("sha256")
    .update(`mega-demo:${key}`)
    .digest()
    .subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function put(
  model: string,
  key: string,
  data: Record<string, any>,
) {
  const id = idFor(key);

  return db[model].upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
}

async function putBy(
  model: string,
  where: Record<string, any>,
  data: Record<string, any>,
) {
  const current = await db[model].findFirst({ where });

  if (current) {
    return db[model].update({
      where: { id: current.id },
      data,
    });
  }

  return db[model].create({ data });
}

const date = (value: string) =>
  new Date(`${value}T12:00:00.000Z`);

async function main() {
  console.log("Criando base demonstrativa da Mega...");

  // ==========================================
  // PERFIS, PERMISSÕES E USUÁRIOS
  // ==========================================

  const profiles = {
    admin: await putBy("accessProfile", { name: "ADMINISTRADOR" }, {
      name: "ADMINISTRADOR",
      description: "Acesso administrativo do sistema",
      status: "ACTIVE",
    }),
    engineer: await putBy("accessProfile", { name: "ENGENHEIRO" }, {
      name: "ENGENHEIRO",
      description: "Gestão técnica e acompanhamento operacional",
      status: "ACTIVE",
    }),
    executor: await putBy("accessProfile", { name: "EXECUTOR" }, {
      name: "EXECUTOR",
      description: "Execução e atualização das atividades atribuídas",
      status: "ACTIVE",
    }),
  };

  const permissions = [
    ["DASHBOARD_ACCESS", "Acessar dashboard", "DASHBOARD"],
    ["CLIENTS_ACCESS", "Acessar clientes", "CLIENTS"],
    ["UNITS_ACCESS", "Acessar unidades", "UNITS"],
    ["IMPLEMENTATIONS_ACCESS", "Visualizar implantações", "IMPLEMENTATIONS"],
    ["IMPLEMENTATIONS_CREATE", "Criar implantações", "IMPLEMENTATIONS"],
    ["IMPLEMENTATIONS_UPDATE", "Editar implantações", "IMPLEMENTATIONS"],
    ["IMPLEMENTATIONS_CANCEL", "Cancelar implantações", "IMPLEMENTATIONS"],
    ["IMPLEMENTATIONS_MANAGE_STAGES", "Gerenciar etapas", "IMPLEMENTATIONS"],
    ["ACTIVITIES_ACCESS", "Visualizar atividades", "ACTIVITIES"],
    ["ACTIVITIES_CREATE", "Criar atividades", "ACTIVITIES"],
    ["ACTIVITIES_UPDATE", "Editar atividades", "ACTIVITIES"],
    ["ACTIVITIES_ASSIGN", "Atribuir responsáveis", "ACTIVITIES"],
    ["ACTIVITIES_EXECUTE", "Executar atividades", "ACTIVITIES"],
    ["ACTIVITIES_SUPERVISE", "Supervisionar atividades", "ACTIVITIES"],
    ["ACTIVITIES_COMPLETE", "Concluir atividades", "ACTIVITIES"],
    ["ACTIVITIES_APPROVE", "Aprovar atividades", "ACTIVITIES"],
    ["ACTIVITIES_LINK", "Vincular atividades", "ACTIVITIES"],
    ["ACTIVITIES_MANAGE", "Gerenciar todas as atividades", "ACTIVITIES"],
    ["PROVIDERS_ACCESS", "Acessar provedores", "PROVIDERS"],
    ["TECHNICIANS_ACCESS", "Acessar técnicos", "TECHNICIANS"],
    ["OCCURRENCES_ACCESS", "Acessar chamados", "OCCURRENCES"],
    ["REPORTS_ACCESS", "Acessar relatórios", "REPORTS"],
    ["SETTINGS_ACCESS", "Acessar configurações", "SETTINGS"],
    ["USERS_ACCESS", "Acessar usuários", "USERS"],
    ["ACCESS_PROFILES_ACCESS", "Acessar perfis e permissões", "ACCESS_PROFILES"],
  ] as const;

  const permissionRecords: any[] = [];

  for (const [code, name, module] of permissions) {
    permissionRecords.push(
      await putBy(
        "permission",
        { code },
        {
          code,
          name,
          module,
          description: `Permite ${name.toLowerCase()} no sistema`,
        },
      ),
    );
  }

  const engineerCodes = new Set([
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
  ]);

  const executorCodes = new Set([
    "DASHBOARD_ACCESS",
    "UNITS_ACCESS",
    "IMPLEMENTATIONS_ACCESS",
    "ACTIVITIES_ACCESS",
    "ACTIVITIES_EXECUTE",
    "OCCURRENCES_ACCESS",
  ]);

  for (const permission of permissionRecords) {
    const profileList = [
      profiles.admin,
      ...(engineerCodes.has(permission.code)
        ? [profiles.engineer]
        : []),
      ...(executorCodes.has(permission.code)
        ? [profiles.executor]
        : []),
    ];

    if (
      !engineerCodes.has(permission.code) &&
      !executorCodes.has(permission.code)
    ) {
      profileList.push(profiles.engineer);
    }

    for (const profile of profileList) {
      await putBy(
        "profilePermission",
        {
          accessProfileId: profile.id,
          permissionId: permission.id,
        },
        {
          accessProfileId: profile.id,
          permissionId: permission.id,
        },
      );
    }
  }

  const passwordHash = await bcrypt.hash(
    process.env.DEMO_USER_PASSWORD || "Mega@123456",
    12,
  );

  const users = {
    admin: await put("user", "user:admin@mega.local", {
      name: "Administrador Mega",
      email: "admin@mega.local",
      passwordHash,
      accessProfileId: profiles.admin.id,
      status: "ACTIVE",
    }),

    engineer1: await put("user", "user:engenharia@mega.local", {
      name: "Rafael Mendes",
      email: "engenharia@mega.local",
      passwordHash,
      accessProfileId: profiles.engineer.id,
      status: "ACTIVE",
    }),

    engineer2: await put("user", "user:projetos@mega.local", {
      name: "Camila Nogueira",
      email: "projetos@mega.local",
      passwordHash,
      accessProfileId: profiles.engineer.id,
      status: "ACTIVE",
    }),

    executor1: await put("user", "user:campo1@mega.local", {
      name: "Lucas Ferreira",
      email: "campo1@mega.local",
      passwordHash,
      accessProfileId: profiles.executor.id,
      status: "ACTIVE",
    }),

    executor2: await put("user", "user:campo2@mega.local", {
      name: "Bruno Costa",
      email: "campo2@mega.local",
      passwordHash,
      accessProfileId: profiles.executor.id,
      status: "ACTIVE",
    }),
  };

  // ==========================================
  // CLIENTES
  // ==========================================

  const companiesData = [
    {
      key: "alsol",
      tradeName: "Alsol Energiza",
      corporateName: "Alsol Energiza (cadastro demonstrativo)",
      cnpj: "10000000000001",
      observations:
        "Cadastro demonstrativo. Dados cadastrais e contatos fictícios.",
    },
    {
      key: "ivi",
      tradeName: "IVI Energia",
      corporateName: "IVI Energia (cadastro demonstrativo)",
      cnpj: "10000000000002",
      observations:
        "Cliente citado no relatório técnico da UFV Vassouras 01. Dados cadastrais fictícios.",
    },
    {
      key: "delta",
      tradeName: "Delta",
      corporateName: "Delta (cadastro demonstrativo)",
      cnpj: "10000000000003",
      observations:
        "Cliente associado ao projeto de CFTV e integração SCADA em Quatis.",
    },
    {
      key: "origo",
      tradeName: "Órigo Energia",
      corporateName: "Órigo Energia (cadastro demonstrativo)",
      cnpj: "10000000000004",
      observations:
        "Empresa incluída conforme orientação para a demonstração. Dados cadastrais fictícios.",
    },
    {
      key: "vivo",
      tradeName: "Vivo",
      corporateName: "Vivo (cadastro demonstrativo)",
      cnpj: "10000000000005",
      observations:
        "Projeto POC Torre Inteligente. Dados cadastrais fictícios.",
    },
  ];

  const companies: Record<string, any> = {};

  for (const item of companiesData) {
    companies[item.key] = await put(
      "company",
      `company:${item.key}`,
      {
        corporateName: item.corporateName,
        tradeName: item.tradeName,
        cnpj: item.cnpj,
        relationshipStage: "CUSTOMER",
        status: "ACTIVE",
        observations: item.observations,
      },
    );
  }

  // ==========================================
  // CONTATOS DOS CLIENTES
  // ==========================================

  const contacts = [
    [
      "ivi",
      "Diego Gomes",
      "O&M",
      "contato.ivi@example.test",
      "+55 21 3000-0001",
    ],
    [
      "delta",
      "Mariana Oliveira",
      "Coordenação de Projetos",
      "delta.projetos@example.test",
      "+55 24 3000-0002",
    ],
    [
      "alsol",
      "André Ribeiro",
      "Operações",
      "operacoes.alsol@example.test",
      "+55 65 3000-0003",
    ],
    [
      "origo",
      "Fernanda Lima",
      "Implantação",
      "implantacao.origo@example.test",
      "+55 16 3000-0004",
    ],
    [
      "vivo",
      "Paulo Martins",
      "Projetos Especiais",
      "projetos.vivo@example.test",
      "+55 11 3000-0005",
    ],
  ] as const;

  for (const [companyKey, name, role, email, phone] of contacts) {
    await put("companyContact", `contact:${companyKey}`, {
      companyId: companies[companyKey].id,
      name,
      role,
      email,
      phone,
      whatsapp: phone,
      isPrimary: true,
    });
  }

  // ==========================================
  // PROVEDORES
  // ==========================================

  const providersData = [
    {
      key: "mega",
      name: "MEGA Soluções Telecom",
      phone: "+55 34 3219-7181",
      observations:
        "Provedor/integradora de serviços da operação demonstrativa.",
    },
    {
      key: "fiber",
      name: "Operadora Fibra Regional (demo)",
      phone: "+55 34 3000-0100",
      observations: "Provedor fictício para demonstrar conectividade.",
    },
    {
      key: "radio",
      name: "Conectividade Rádio (demo)",
      phone: "+55 34 3000-0200",
      observations: "Provedor fictício para cenários de contingência.",
    },
  ];

  const providers: Record<string, any> = {};

  for (const p of providersData) {
    providers[p.key] = await put("provider", `provider:${p.key}`, {
      name: p.name,
      phone: p.phone,
      status: "ACTIVE",
      observations: p.observations,
    });
  }

  await put("providerContact", "provider-contact:mega", {
    providerId: providers.mega.id,
    name: "Central de Projetos Mega",
    role: "Suporte técnico",
    email: "projetos@mega.udi.br",
    phone: "+55 34 3219-7181",
    isPrimary: true,
  });

  // ==========================================
  // UNIDADES
  // ==========================================

  const unitsData = [
    {
      key: "ivi-vassouras",
      company: "ivi",
      name: "UFV Vassouras 01",
      type: "USINA_FOTOVOLTAICA",
      city: "Vassouras",
      state: "RJ",
      lat: -22.222779,
      lng: -43.404331,
      note: "Unidade citada no relatório de instalação de internet dedicada de agosto/2026.",
    },
    {
      key: "delta-quatis",
      company: "delta",
      name: "UFV Delta Quatis",
      type: "USINA_FOTOVOLTAICA",
      city: "Quatis",
      state: "RJ",
      note: "Projeto de CFTV e integração SCADA, conforme material técnico recebido.",
    },
    {
      key: "alsol-caceres",
      company: "alsol",
      name: "UFV Cáceres 1 (CR1)",
      type: "USINA_FOTOVOLTAICA",
      city: "Cáceres",
      state: "MT",
      note: "Unidade utilizada para demonstração de infraestrutura de rede e equipamentos.",
    },
    {
      key: "origo-franca",
      company: "origo",
      name: "UFV Franca",
      type: "USINA_FOTOVOLTAICA",
      city: "Franca",
      state: "SP",
      note: "Unidade de demonstração baseada no conjunto de projetos Órigo recebido.",
    },
    {
      key: "origo-uberaba",
      company: "origo",
      name: "UFV Uberaba",
      type: "USINA_FOTOVOLTAICA",
      city: "Uberaba",
      state: "MG",
      note: "Unidade de demonstração baseada no conjunto de projetos Órigo recebido.",
    },
    {
      key: "vivo-joaodias",
      company: "vivo",
      name: "Site João Dias - POC Torre Inteligente",
      type: "SITE_CORPORATIVO",
      city: "São Paulo",
      state: "SP",
      note: "Local de POC Torre Inteligente citado no cronograma recebido.",
    },
  ];

  const units: Record<string, any> = {};

  for (const u of unitsData) {
    const company = companies[u.company];

    units[u.key] = await put("unit", `unit:${u.key}`, {
      companyId: company.id,
      name: u.name,
      type: u.type,
      status: "ACTIVE",
      observations: u.note,
    });

    await put("unitAddress", `unit-address:${u.key}`, {
      unitId: units[u.key].id,
      city: u.city,
      state: u.state,
      areaType: "RURAL",
      latitude: u.lat ?? null,
      longitude: u.lng ?? null,
      observations:
        "Endereço demonstrativo; confirmar antes de uso operacional.",
    });
  }

  // ==========================================
  // CONECTIVIDADE
  // ==========================================

  const connectivity = [
    {
      key: "ivi-vassouras-link",
      unit: "ivi-vassouras",
      provider: "mega",
      name: "Link IP principal - fibra",
      technology: "Fibra Óptica FTTB",
      download: 10,
      upload: 10,
      response: 5,
      throughput: 100,
      rx: -26.52,
      publicIp: "198.51.100.10",
      localIp: "192.168.1.1",
      sla: 98.3,
      mttr: 12,
      network: "UFV IVI VASSOURAS",
      monitoring: true,
      start: "2026-08-05",
      end: "2027-08-05",
      note: "Parâmetros técnicos reproduzidos do relatório; IP público substituído por endereço reservado para documentação.",
    },
    {
      key: "delta-quatis-link",
      unit: "delta-quatis",
      provider: "fiber",
      name: "Link de dados - principal",
      technology: "Fibra Óptica",
      download: 50,
      upload: 50,
      response: 8,
      throughput: 80,
      rx: -23.4,
      publicIp: "198.51.100.20",
      localIp: "192.168.10.1",
      sla: 99.0,
      mttr: 8,
      network: "DELTA QUATIS",
      monitoring: true,
      start: "2026-09-01",
      end: "2027-09-01",
      note: "Valores ilustrativos para demonstração, não são medições confirmadas.",
    },
    {
      key: "alsol-caceres-link",
      unit: "alsol-caceres",
      provider: "radio",
      name: "Link de contingência",
      technology: "Rádio",
      download: 20,
      upload: 10,
      response: 18,
      throughput: 25,
      rx: -61,
      publicIp: "198.51.100.30",
      localIp: "192.168.20.1",
      sla: 97.5,
      mttr: 6,
      network: "ALSOL CACERES",
      monitoring: true,
      start: "2026-10-01",
      end: "2027-10-01",
      note: "Valores ilustrativos para demonstração.",
    },
  ];

  for (const c of connectivity) {
    await put("unitConnectivity", `connectivity:${c.key}`, {
      unitId: units[c.unit].id,
      providerId: providers[c.provider].id,
      name: c.name,
      technology: c.technology,
      downloadCapacityMbps: c.download,
      uploadCapacityMbps: c.upload,
      responseTimeMs: c.response,
      throughputMbps: c.throughput,
      rxSignalDbm: c.rx,
      publicIp: c.publicIp,
      localIp: c.localIp,
      slaPercentage: c.sla,
      mttrHours: c.mttr,
      networkName: c.network,
      monitoringEnabled: c.monitoring,
      serviceStartDate: date(c.start),
      serviceEndDate: date(c.end),
      status: "ACTIVE",
      observations: c.note,
    });
  }

  // ==========================================
  // TEMPLATES DE IMPLANTAÇÃO
  // ==========================================

  const templateDefinitions = [
    {
      key: "cftv",
      name: "Implantação de CFTV em usina",
      description:
        "Fluxo de vistoria, infraestrutura, instalação, configuração e comissionamento.",
      stages: [
        [
          "Planejamento e vistoria",
          [
            "Validar escopo e pontos de câmera",
            "Realizar vistoria técnica",
            "Validar infraestrutura e energia",
          ],
        ],
        [
          "Infraestrutura e instalação",
          [
            "Instalar infraestrutura e cabeamento",
            "Instalar câmeras e equipamentos",
            "Identificar e organizar cabeamento",
          ],
        ],
        [
          "Configuração e integração",
          [
            "Configurar endereçamento IP",
            "Integrar equipamentos à rede",
            "Validar gravação e acesso remoto",
          ],
        ],
        [
          "Testes e entrega",
          [
            "Executar testes funcionais",
            "Registrar evidências fotográficas",
            "Emitir relatório de comissionamento",
          ],
        ],
      ],
    },
    {
      key: "connectivity",
      name: "Ativação de link dedicado",
      description:
        "Fluxo de ativação, configuração e validação de conectividade.",
      stages: [
        [
          "Preparação",
          [
            "Confirmar disponibilidade e escopo",
            "Realizar vistoria do ponto de instalação",
          ],
        ],
        [
          "Instalação",
          [
            "Instalar enlace e equipamentos",
            "Configurar roteador e interface WAN",
          ],
        ],
        [
          "Validação",
          [
            "Validar IP e conectividade",
            "Executar teste de throughput e latência",
            "Registrar parâmetros e evidências",
          ],
        ],
        [
          "Entrega",
          [
            "Documentar acesso e topologia",
            "Formalizar ativação e SLA",
          ],
        ],
      ],
    },
    {
      key: "scada",
      name: "Integração de rede e SCADA",
      description:
        "Fluxo de levantamento, configuração, testes de comunicação e entrega.",
      stages: [
        [
          "Levantamento técnico",
          [
            "Levantar topologia e endereçamento",
            "Validar protocolos e pontos de integração",
          ],
        ],
        [
          "Configuração",
          [
            "Configurar comunicação TCP/IP",
            "Validar comunicação Modbus",
            "Integrar equipamentos ao supervisório",
          ],
        ],
        [
          "Comissionamento",
          [
            "Executar testes integrados",
            "Registrar pendências e evidências",
            "Entregar documentação técnica",
          ],
        ],
      ],
    },
  ];

  const templates: Record<string, any> = {};

  for (const t of templateDefinitions) {
    templates[t.key] = await put("template", `template:${t.key}`, {
      name: t.name,
      description: t.description,
      status: "PUBLISHED",
    });

    for (let si = 0; si < t.stages.length; si++) {
      const [stageName, activityNames] = t.stages[si] as [
        string,
        string[],
      ];

      const stage = await put(
        "templateStage",
        `template-stage:${t.key}:${si + 1}`,
        {
          templateId: templates[t.key].id,
          name: stageName,
          description: `Etapa ${si + 1} do fluxo ${t.name}.`,
          order: si + 1,
        },
      );

      for (let ai = 0; ai < activityNames.length; ai++) {
        const activity = await put(
          "templateActivity",
          `template-activity:${t.key}:${si + 1}:${ai + 1}`,
          {
            stageId: stage.id,
            name: activityNames[ai],
            description: "Atividade prevista no roteiro de implantação.",
            order: ai + 1,
          },
        );

        await put(
          "activityRequirement",
          `template-requirement:${t.key}:${si + 1}:${ai + 1}`,
          {
            activityId: activity.id,
            type: "EVIDENCE",
            isRequired: ai === activityNames.length - 1,
            order: 1,
            configuration: {
              description: "Anexar evidência ou registro da execução.",
            },
          },
        );
      }
    }
  }

  // ==========================================
  // FORMULÁRIO DE COMISSIONAMENTO
  // ==========================================

  const form = await put("formTemplate", "form:checklist-comissionamento", {
    name: "Checklist de comissionamento",
    description:
      "Formulário demonstrativo para validação técnica da implantação.",
    status: "ACTIVE",
  });

  const formFields = [
    [
      "site_condition",
      "Condição do local",
      "SINGLE_SELECT",
      true,
      ["Conforme", "Com ressalvas", "Não conforme"],
    ],
    [
      "connectivity_test",
      "Teste de conectividade",
      "SINGLE_SELECT",
      true,
      ["Aprovado", "Reprovado", "Não aplicável"],
    ],
    [
      "observations",
      "Observações técnicas",
      "TEXTAREA",
      false,
      null,
    ],
    [
      "completion_date",
      "Data da validação",
      "DATE",
      true,
      null,
    ],
  ] as const;

  for (let i = 0; i < formFields.length; i++) {
    const [key, label, type, isRequired, options] = formFields[i];

    await put("formField", `form-field:${key}`, {
      formTemplateId: form.id,
      key,
      label,
      type,
      isRequired,
      order: i + 1,
      options: options ? [...options] : undefined,
    });
  }

  // ==========================================
  // IMPLANTAÇÕES
  // ==========================================

  const implementationDefinitions = [
    {
      key: "ivi-vassouras",
      name: "Ativação de internet dedicada - UFV Vassouras 01",
      company: "ivi",
      unit: "ivi-vassouras",
      template: "connectivity",
      status: "COMPLETED",
      started: "2026-08-04",
      completed: "2026-08-05",
      progress: [
        "COMPLETED",
        "COMPLETED",
        "COMPLETED",
        "COMPLETED",
      ],
    },
    {
      key: "delta-quatis",
      name: "Implantação de CFTV e integração SCADA - UFV Delta Quatis",
      company: "delta",
      unit: "delta-quatis",
      template: "cftv",
      status: "IN_PROGRESS",
      started: "2026-10-20",
      progress: [
        "COMPLETED",
        "IN_PROGRESS",
        "NOT_STARTED",
        "NOT_STARTED",
      ],
    },
    {
      key: "alsol-caceres",
      name: "Infraestrutura de rede - UFV Cáceres 1",
      company: "alsol",
      unit: "alsol-caceres",
      template: "scada",
      status: "IN_PROGRESS",
      started: "2026-11-03",
      progress: [
        "COMPLETED",
        "IN_PROGRESS",
        "NOT_STARTED",
      ],
    },
    {
      key: "origo-franca",
      name: "Implantação de CFTV - UFV Franca",
      company: "origo",
      unit: "origo-franca",
      template: "cftv",
      status: "IN_PROGRESS",
      started: "2026-11-10",
      progress: [
        "COMPLETED",
        "IN_PROGRESS",
        "NOT_STARTED",
        "NOT_STARTED",
      ],
    },
    {
      key: "vivo-joaodias",
      name: "POC Torre Inteligente - Site João Dias",
      company: "vivo",
      unit: "vivo-joaodias",
      template: "scada",
      status: "IN_PROGRESS",
      started: "2026-11-17",
      progress: [
        "IN_PROGRESS",
        "NOT_STARTED",
        "NOT_STARTED",
      ],
    },
  ];

  for (const def of implementationDefinitions) {
    const company = companies[def.company];
    const unit = units[def.unit];
    const template = templates[def.template];

    const implementation = await put(
      "implementation",
      `implementation:${def.key}`,
      {
        name: def.name,
        description:
          "Registro demonstrativo construído a partir dos escopos e documentos compartilhados. Confirmar dados e cronograma antes de uso operacional.",
        unitId: unit.id,
        companyId: company.id,
        templateId: template.id,
        status: def.status,
        startedAt: date(def.started),
        completedAt: def.completed ? date(def.completed) : null,
        templateName: template.name,
        templateDescription: template.description,
        unitName: unit.name,
        companyTradeName: company.tradeName,
        addressCity:
          def.unit === "ivi-vassouras"
            ? "Vassouras"
            : def.unit === "delta-quatis"
              ? "Quatis"
              : def.unit === "alsol-caceres"
                ? "Cáceres"
                : def.unit === "origo-franca"
                  ? "Franca"
                  : "São Paulo",
        addressState:
          def.unit === "ivi-vassouras" ||
          def.unit === "delta-quatis"
            ? "RJ"
            : def.unit === "alsol-caceres"
              ? "MT"
              : "SP",
        initialProviderId: providers.mega.id,
        initialProviderName: providers.mega.name,
      },
    );

    const sourceStages = await db.templateStage.findMany({
      where: { templateId: template.id },
      orderBy: { order: "asc" },
      include: {
        activities: {
          orderBy: { order: "asc" },
        },
      },
    });

    for (let si = 0; si < sourceStages.length; si++) {
      const sourceStage = sourceStages[si];
      const stageStatus = def.progress[si] || "NOT_STARTED";

      const stage = await put(
        "implementationStage",
        `implementation-stage:${def.key}:${si + 1}`,
        {
          implementationId: implementation.id,
          sourceStageId: sourceStage.id,
          name: sourceStage.name,
          description: sourceStage.description,
          order: si + 1,
          status: stageStatus,
          startedAt:
            stageStatus === "NOT_STARTED"
              ? null
              : date(def.started),
          completedAt:
            stageStatus === "COMPLETED"
              ? date(def.completed || def.started)
              : null,
        },
      );

      for (
        let ai = 0;
        ai < sourceStage.activities.length;
        ai++
      ) {
        const sourceActivity = sourceStage.activities[ai];

        const activityStatus =
          stageStatus === "COMPLETED"
            ? "COMPLETED"
            : stageStatus === "IN_PROGRESS" && ai === 0
              ? "IN_PROGRESS"
              : "NOT_STARTED";

        const city =
          def.unit === "ivi-vassouras"
            ? "Vassouras"
            : def.unit === "delta-quatis"
              ? "Quatis"
              : def.unit === "alsol-caceres"
                ? "Cáceres"
                : def.unit === "origo-franca"
                  ? "Franca"
                  : "São Paulo";

        const state =
          def.unit === "ivi-vassouras" ||
          def.unit === "delta-quatis"
            ? "RJ"
            : def.unit === "alsol-caceres"
              ? "MT"
              : "SP";

        const activity = await put(
          "activity",
          `activity:${def.key}:${si + 1}:${ai + 1}`,
          {
            implementationId: implementation.id,
            stageId: stage.id,
            sourceActivityId: sourceActivity.id,
            companyId: company.id,
            unitId: unit.id,
            name: sourceActivity.name,
            description: sourceActivity.description,
            order: ai + 1,
            status: activityStatus,
            startedAt:
              activityStatus === "NOT_STARTED"
                ? null
                : date(def.started),
            completedAt:
              activityStatus === "COMPLETED"
                ? date(def.completed || def.started)
                : null,
            unitName: unit.name,
            companyTradeName: company.tradeName,
            addressCity: city,
            addressState: state,
            initialProviderId: providers.mega.id,
            initialProviderName: providers.mega.name,
          },
        );

        const executor =
          (si + ai) % 2 === 0
            ? users.executor1
            : users.executor2;

        const supervisor =
          si % 2 === 0
            ? users.engineer1
            : users.engineer2;

        await put(
          "activityAssignment",
          `assignment:${def.key}:${si + 1}:${ai + 1}:executor`,
          {
            activityId: activity.id,
            userId: executor.id,
            userName: executor.name,
            role: "EXECUTOR",
          },
        );

        await put(
          "activityAssignment",
          `assignment:${def.key}:${si + 1}:${ai + 1}:supervisor`,
          {
            activityId: activity.id,
            userId: supervisor.id,
            userName: supervisor.name,
            role: "SUPERVISOR",
          },
        );

        if (activityStatus === "COMPLETED") {
          const requirement = await put(
            "implementationRequirement",
            `implementation-requirement:${def.key}:${si + 1}:${ai + 1}`,
            {
              activityId: activity.id,
              type: "EVIDENCE",
              isRequired: false,
              order: 1,
              configuration: {
                description: "Registro demonstrativo da execução.",
              },
            },
          );

          await put(
            "activityEvidence",
            `evidence:${def.key}:${si + 1}:${ai + 1}`,
            {
              activityId: activity.id,
              requirementId: requirement.id,
              evidenceType: "PHOTO",
              fileName: `evidencia-${def.key}-${si + 1}-${ai + 1}.jpg`,
              storageKey: `demo/evidences/${def.key}/${si + 1}-${ai + 1}.jpg`,
            },
          );
        }
      }
    }
  }

  // ==========================================
  // OPORTUNIDADES COMERCIAIS
  // ==========================================

  const opportunities = [
    {
      key: "ivi-expansao",
      company: "ivi",
      title: "Expansão de conectividade - novas unidades",
      stage: "PROPOSAL",
      value: "48500.00",
      probability: 70,
      close: "2026-12-18",
      owner: users.engineer1,
    },
    {
      key: "delta-manutencao",
      company: "delta",
      title: "Manutenção e expansão do sistema CFTV",
      stage: "NEGOTIATION",
      value: "32000.00",
      probability: 60,
      close: "2026-12-10",
      owner: users.engineer2,
    },
    {
      key: "origo-novas-usinas",
      company: "origo",
      title: "Implantação CFTV - novas usinas",
      stage: "QUALIFICATION",
      value: "92000.00",
      probability: 35,
      close: "2027-01-20",
      owner: users.engineer1,
    },
    {
      key: "vivo-poc-expansao",
      company: "vivo",
      title: "Expansão da POC Torre Inteligente",
      stage: "PROPOSAL",
      value: "67000.00",
      probability: 50,
      close: "2027-01-15",
      owner: users.engineer2,
    },
  ];

  for (const o of opportunities) {
    await put("opportunity", `opportunity:${o.key}`, {
      companyId: companies[o.company].id,
      ownerId: o.owner.id,
      title: o.title,
      description: "Oportunidade demonstrativa para apresentação comercial.",
      estimatedValue: o.value,
      stage: o.stage,
      status: "ACTIVE",
      probability: o.probability,
      expectedCloseDate: date(o.close),
    });
  }

  console.log("Seed demonstrativo concluído.");

  console.log(
    "Usuários: admin@mega.local, engenharia@mega.local, projetos@mega.local, campo1@mega.local, campo2@mega.local",
  );

  console.log(
    "Senha padrão de demonstração: Mega@123456 (ou DEMO_USER_PASSWORD no ambiente).",
  );
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed demonstrativo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
