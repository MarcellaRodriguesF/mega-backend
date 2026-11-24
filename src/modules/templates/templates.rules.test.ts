import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { requirementSchema } from "./templates.schemas.js";
import { TEMPLATES_ACCESS_PERMISSION } from "./templates.constants.js";
import {
  assertEvidenceRequirement,
  assertSameIdSet,
  assertTemplatePublishable,
  type PublishableTemplate,
} from "./templates.rules.js";
import { ApiError } from "../../shared/http/api-error.js";

const formId = "6d9f5c2a-3c1e-4f0a-9b8d-1a2b3c4d5e6f";

function publishable(
  overrides: Partial<PublishableTemplate> = {},
): PublishableTemplate {
  return {
    stages: [
      {
        activities: [
          {
            requirements: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("permissão de templates", () => {
  it("usa a permissão administrativa de configurações", () => {
    assert.equal(TEMPLATES_ACCESS_PERMISSION, "SETTINGS_ACCESS");
  });
});

describe("publicação de template", () => {
  it("aceita um template com etapa e atividade", () => {
    assert.doesNotThrow(() => assertTemplatePublishable(publishable()));
  });

  it("recusa template sem etapa", () => {
    assert.throws(
      () => assertTemplatePublishable({ stages: [] }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.message.includes("pelo menos uma etapa"),
    );
  });

  it("recusa template sem atividade", () => {
    assert.throws(
      () =>
        assertTemplatePublishable({
          stages: [{ activities: [] }],
        }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.message.includes("pelo menos uma atividade"),
    );
  });

  it("recusa evidência obrigatória sem tipos", () => {
    assert.throws(
      () =>
        assertTemplatePublishable({
          stages: [
            {
              activities: [
                {
                  requirements: [
                    {
                      type: "EVIDENCE",
                      isRequired: true,
                      evidenceTypes: [],
                      formTemplate: null,
                      configuration: null,
                    },
                  ],
                },
              ],
            },
          ],
        }),
      (error: unknown) => error instanceof ApiError,
    );
  });

  it("recusa formulário inativo em requisito obrigatório", () => {
    assert.throws(
      () =>
        assertTemplatePublishable({
          stages: [
            {
              activities: [
                {
                  requirements: [
                    {
                      type: "FORM",
                      isRequired: true,
                      evidenceTypes: [],
                      formTemplate: { status: "INACTIVE" },
                      configuration: null,
                    },
                  ],
                },
              ],
            },
          ],
        }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.code === "TEMPLATE_STRUCTURE_INVALID",
    );
  });

  it("recusa percentual fora de 0 a 100", () => {
    const parsed = requirementSchema.safeParse({
      type: "COMPLETION_PERCENTAGE",
      isRequired: true,
      configuration: { minimumPercentage: 120 },
    });

    assert.equal(parsed.success, false);
  });
});

describe("requisitos", () => {
  it("normaliza tipos de evidência e exige ao menos um quando obrigatório", () => {
    assert.deepEqual(assertEvidenceRequirement(true, [" photo ", "PDF"]), [
      "PHOTO",
      "PDF",
    ]);

    assert.throws(() => assertEvidenceRequirement(true, []), ApiError);
  });

  it("exige formulário no requisito FORM", () => {
    const parsed = requirementSchema.safeParse({
      type: "FORM",
      isRequired: true,
    });

    assert.equal(parsed.success, false);
  });

  it("aceita formulário informado", () => {
    const parsed = requirementSchema.safeParse({
      type: "FORM",
      isRequired: false,
      formTemplateId: formId,
    });

    assert.equal(parsed.success, true);
  });

  it("exige unidade e quantidade planejada quando o requisito é obrigatório", () => {
    const parsed = requirementSchema.safeParse({
      type: "QUANTITY",
      isRequired: true,
      configuration: { unit: "km", plannedQuantity: null },
    });

    assert.equal(parsed.success, false);
  });

  it("aceita comentário sem configuração extra", () => {
    const parsed = requirementSchema.parse({
      type: "COMMENT",
      isRequired: true,
    });

    assert.equal(parsed.type, "COMMENT");
    assert.equal(parsed.configuration, null);
  });
});

describe("reordenação", () => {
  it("aceita a mesma coleção de ids", () => {
    assert.doesNotThrow(() =>
      assertSameIdSet(["a", "b"], ["b", "a"]),
    );
  });

  it("recusa lista incompleta ou duplicada", () => {
    assert.throws(() => assertSameIdSet(["a", "b"], ["a"]), ApiError);
    assert.throws(() => assertSameIdSet(["a", "b"], ["a", "a"]), ApiError);
    assert.throws(() => assertSameIdSet(["a"], ["b"]), ApiError);
  });
});
