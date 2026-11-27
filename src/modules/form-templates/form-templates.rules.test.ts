import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formFieldSchema } from "./form-templates.schemas.js";
import {
  assertFieldOptions,
  assertFormTemplateCanBeDeleted,
} from "./form-templates.rules.js";
import { ApiError } from "../../shared/http/api-error.js";

describe("campos de formulário", () => {
  it("exige opções em campos de seleção", () => {
    assert.throws(
      () => assertFieldOptions("SINGLE_SELECT", null),
      ApiError,
    );
  });

  it("recusa opções em campos que não são de seleção", () => {
    assert.throws(
      () =>
        assertFieldOptions("TEXT", [{ value: "a", label: "A" }]),
      ApiError,
    );
  });

  it("aceita um campo de texto sem opções", () => {
    const parsed = formFieldSchema.parse({
      key: "observacao",
      label: "Observação",
      type: "TEXT",
      isRequired: false,
    });

    assert.equal(parsed.options, null);
    assert.equal(parsed.key, "observacao");
  });

  it("recusa chave duplicada na validação de opções", () => {
    const parsed = formFieldSchema.safeParse({
      key: "tipo",
      label: "Tipo",
      type: "MULTIPLE_SELECT",
      isRequired: true,
      options: [
        { value: "foto", label: "Foto" },
        { value: "foto", label: "Outra foto" },
      ],
    });

    assert.equal(parsed.success, false);
  });

  it("recusa chave fora do padrão", () => {
    const parsed = formFieldSchema.safeParse({
      key: "1campo",
      label: "Campo",
      type: "TEXT",
      isRequired: false,
    });

    assert.equal(parsed.success, false);
  });
});

describe("exclusão de formulário", () => {
  it("bloqueia exclusão quando existem requisitos vinculados", () => {
    assert.throws(
      () => assertFormTemplateCanBeDeleted(2),
      (error: unknown) =>
        error instanceof ApiError && error.code === "FORM_TEMPLATE_IN_USE",
    );
  });

  it("permite exclusão sem vínculos", () => {
    assert.doesNotThrow(() => assertFormTemplateCanBeDeleted(0));
  });
});
