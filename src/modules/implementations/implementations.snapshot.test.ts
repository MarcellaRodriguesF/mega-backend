import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IMPLEMENTATIONS_ACCESS_PERMISSION } from "./implementations.constants.js";
import { toActiveConnectivity } from "./implementations.presenter.js";
import {
  assertConnectivityFieldTarget,
  assertImplementationTemplatePublished,
  CONNECTIVITY_FIELD_TARGETS,
  resolveInitialProvider,
} from "./implementations.rules.js";
import {
  buildImplementationSnapshot,
  type SourceFormTemplate,
  type SourceTemplate,
} from "./implementations.snapshot.js";
import { ApiError } from "../../shared/http/api-error.js";

const formId = "6d9f5c2a-3c1e-4f0a-9b8d-1a2b3c4d5e6f";
const fieldId = "7e0a6d3b-4d2f-401b-8c9e-2b3c4d5e6f70";

function sourceForm(): SourceFormTemplate {
  return {
    id: formId,
    name: "Relatório de instalação",
    description: "Campos originais",
    status: "ACTIVE",
    fields: [
      {
        id: fieldId,
        key: "tecnologia",
        label: "Tecnologia",
        description: null,
        type: "TEXT",
        placeholder: null,
        isRequired: true,
        order: 0,
        options: null,
      },
    ],
  };
}

function sourceTemplate(): SourceTemplate {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Implantação padrão",
    description: "Estrutura original",
    status: "PUBLISHED",
    stages: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Instalação",
        description: null,
        order: 0,
        activities: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Ativar link",
            description: "Conectar a unidade",
            order: 0,
            requirements: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                type: "FORM",
                isRequired: true,
                order: 0,
                configuration: null,
                formTemplateId: formId,
                evidenceTypes: [],
              },
              {
                id: "55555555-5555-4555-8555-555555555555",
                type: "EVIDENCE",
                isRequired: true,
                order: 1,
                configuration: null,
                formTemplateId: null,
                evidenceTypes: [{ type: "PHOTO" }],
              },
              {
                id: "66666666-6666-4666-8666-666666666666",
                type: "FORM",
                isRequired: false,
                order: 2,
                configuration: { note: "mesmo formulário" },
                formTemplateId: formId,
                evidenceTypes: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("permissão de implantações", () => {
  it("reutiliza IMPLEMENTATIONS_ACCESS", () => {
    assert.equal(IMPLEMENTATIONS_ACCESS_PERMISSION, "IMPLEMENTATIONS_ACCESS");
  });
});

describe("criação a partir de template publicado", () => {
  it("recusa template que não está publicado", () => {
    assert.throws(
      () => assertImplementationTemplatePublished("DRAFT"),
      (error: unknown) =>
        error instanceof ApiError && error.code === "TEMPLATE_NOT_PUBLISHED",
    );
  });

  it("copia etapas, atividades, requisitos e um único snapshot do formulário", () => {
    const snapshot = buildImplementationSnapshot(sourceTemplate(), [sourceForm()]);

    assert.equal(snapshot.templateName, "Implantação padrão");
    assert.equal(snapshot.stages.length, 1);
    assert.equal(snapshot.stages[0]?.activities[0]?.requirements.length, 3);
    assert.equal(snapshot.forms.length, 1);
    assert.equal(snapshot.forms[0]?.fields[0]?.label, "Tecnologia");
    assert.equal(snapshot.forms[0]?.fields[0]?.isSensitive, false);
    assert.equal(snapshot.forms[0]?.fields[0]?.connectivityFieldTarget, null);
    assert.deepEqual(snapshot.stages[0]?.activities[0]?.requirements[1]?.evidenceTypes, [
      "PHOTO",
    ]);
  });

  it("não acompanha alterações posteriores no template ou no formulário", () => {
    const template = sourceTemplate();
    const form = sourceForm();
    const snapshot = buildImplementationSnapshot(template, [form]);

    template.name = "Template alterado";
    template.stages[0]!.name = "Etapa alterada";
    template.stages[0]!.activities[0]!.requirements[1]!.evidenceTypes[0]!.type = "PDF";
    const field = form.fields[0];
    if (field) field.label = "Campo alterado";

    assert.equal(snapshot.templateName, "Implantação padrão");
    assert.equal(snapshot.stages[0]?.name, "Instalação");
    assert.equal(snapshot.forms[0]?.fields[0]?.label, "Tecnologia");
    assert.deepEqual(snapshot.stages[0]?.activities[0]?.requirements[1]?.evidenceTypes, [
      "PHOTO",
    ]);
  });

  it("isola a configuração copiada do objeto original", () => {
    const template = sourceTemplate();
    const snapshot = buildImplementationSnapshot(template, [sourceForm()]);
    const configuration = template.stages[0]?.activities[0]?.requirements[2]?.configuration as {
      note: string;
    };

    configuration.note = "alterado na origem";

    assert.deepEqual(
      snapshot.stages[0]?.activities[0]?.requirements[2]?.configuration,
      { note: "mesmo formulário" },
    );
  });

  it("recusa requisito de formulário sem origem", () => {
    const template = sourceTemplate();
    template.stages[0]!.activities[0]!.requirements[0]!.formTemplateId = null;

    assert.throws(
      () => buildImplementationSnapshot(template, []),
      (error: unknown) =>
        error instanceof ApiError && error.code === "FORM_SNAPSHOT_SOURCE_MISSING",
    );
  });
});

describe("provedor e conectividade", () => {
  it("identifica o provedor da conectividade ativa", () => {
    assert.deepEqual(
      resolveInitialProvider({
        provider: { id: "provider-1", name: "Operadora A" },
      }),
      {
        initialProviderId: "provider-1",
        initialProviderName: "Operadora A",
      },
    );
  });

  it("representa a ausência de provedor sem exigir um novo cadastro", () => {
    assert.deepEqual(resolveInitialProvider(null), {
      initialProviderId: null,
      initialProviderName: null,
    });
    assert.deepEqual(resolveInitialProvider({ provider: null }), {
      initialProviderId: null,
      initialProviderName: null,
    });
  });

  it("mantém os endereços IP como destinos distintos", () => {
    assert.equal(assertConnectivityFieldTarget("PUBLIC_IP"), "PUBLIC_IP");
    assert.equal(assertConnectivityFieldTarget("GATEWAY_IP"), "GATEWAY_IP");
    assert.equal(assertConnectivityFieldTarget("LOCAL_IP"), "LOCAL_IP");
    assert.equal(assertConnectivityFieldTarget("WAN_IP"), "WAN_IP");
    assert.ok(CONNECTIVITY_FIELD_TARGETS.includes("PROVIDER_ID"));
    assert.throws(
      () => assertConnectivityFieldTarget("status"),
      (error: unknown) =>
        error instanceof ApiError && error.code === "CONNECTIVITY_TARGET_INVALID",
    );
  });

  it("não expõe senha nem coluna arbitrária na conectividade exibida", () => {
    const view = toActiveConnectivity({
      id: "connectivity-1",
      name: "Link principal",
      technology: "FIBRA",
      downloadCapacityMbps: 100,
      uploadCapacityMbps: 50,
      responseTimeMs: 12,
      throughputMbps: 80,
      rxSignalDbm: -55,
      publicIp: "203.0.113.10",
      gatewayIp: "203.0.113.1",
      localIp: "10.0.0.2",
      wanIp: "198.51.100.8",
      networkName: "MEGA",
      slaPercentage: 99.5,
      mttrHours: 4,
      monitoringEnabled: true,
      serviceStartDate: null,
      serviceEndDate: null,
      observations: null,
      provider: { id: "provider-1", name: "Operadora A" },
    });

    assert.equal(view?.publicIp, "203.0.113.10");
    assert.equal(view?.wanIp, "198.51.100.8");
    assert.equal(view?.provider?.name, "Operadora A");
    assert.equal("password" in (view ?? {}), false);
  });
});
