import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { fileStorage } from "../../shared/storage/file-storage.service.js";
import { ProviderDocumentsService } from "./provider-documents.service.js";

const suffix = Date.now().toString();
const service = new ProviderDocumentsService();
const storedKeys: string[] = [];
let companyId = "";
let otherCompanyId = "";
let unitId = "";

const file = {
  originalName: "contrato.pdf",
  buffer: Buffer.from("%PDF-1.4\nDocumento de teste"),
};

before(async () => {
  const company = await prisma.company.create({
    data: { tradeName: `Documentos ${suffix}` },
    select: { id: true },
  });
  companyId = company.id;

  const otherCompany = await prisma.company.create({
    data: { tradeName: `Outra empresa documentos ${suffix}` },
    select: { id: true },
  });
  otherCompanyId = otherCompany.id;

  const unit = await prisma.unit.create({
    data: {
      companyId,
      name: `Unidade documentos ${suffix}`,
      type: "USINA",
    },
    select: { id: true },
  });
  unitId = unit.id;
});

after(async () => {
  for (const storageKey of storedKeys) {
    await fileStorage.remove("documents", storageKey).catch(() => undefined);
  }
  if (companyId) await prisma.company.deleteMany({ where: { id: companyId } });
  if (otherCompanyId) {
    await prisma.company.deleteMany({ where: { id: otherCompanyId } });
  }
});

describe("documentos compartilhados da empresa", () => {
  it("armazena arquivo, registra metadados e associa unidade da própria empresa", async () => {
    const document = await service.createForCompany(
      companyId,
      {
        name: "Contrato de teste",
        type: "Contrato",
        unitId,
        observations: null,
      },
      file,
    );
    storedKeys.push(document.storageKey);

    assert.equal(document.companyId, companyId);
    assert.equal(document.providerId, null);
    assert.equal(document.unitId, unitId);
    assert.equal(document.type, "Contrato");
    assert.equal(document.fileName, "contrato.pdf");

    const opened = await service.openCompanyFile(
      document.id,
      companyId,
      "attachment",
    );
    assert.equal(opened.sizeBytes, file.buffer.length);
    assert.equal(opened.mimeType, "application/pdf");
    opened.stream.destroy();

    const listed = await service.findAllByCompany(companyId);
    assert.equal(
      listed.some((item) => item.id === document.id),
      true,
    );

    const updated = await service.updateForCompany(document.id, companyId, {
      name: "Contrato atualizado",
      type: "Aditivo",
      unitId: null,
    });
    assert.equal(updated.name, "Contrato atualizado");
    assert.equal(updated.type, "Aditivo");
    assert.equal(updated.unitId, null);

    await service.deleteForCompany(document.id, companyId);
    const afterDelete = await service.findAllByCompany(companyId);
    assert.equal(
      afterDelete.some((item) => item.id === document.id),
      false,
    );
    storedKeys.pop();
  });

  it("recusa unidade de outra empresa e impede acesso cruzado ao documento", async () => {
    const otherUnit = await prisma.unit.create({
      data: {
        companyId: otherCompanyId,
        name: `Unidade alheia ${suffix}`,
        type: "USINA",
      },
      select: { id: true },
    });

    await assert.rejects(
      service.createForCompany(
        companyId,
        {
          name: "Documento inválido",
          type: null,
          unitId: otherUnit.id,
          observations: null,
        },
        file,
      ),
      (error: unknown) =>
        error instanceof ApiError &&
        error.code === "COMPANY_DOCUMENT_UNIT_MISMATCH",
    );

    const document = await service.createForCompany(
      companyId,
      {
        name: "Documento privado",
        type: null,
        unitId: null,
        observations: null,
      },
      file,
    );
    storedKeys.push(document.storageKey);

    await assert.rejects(
      service.findByCompany(document.id, otherCompanyId),
      (error: unknown) =>
        error instanceof ApiError &&
        error.code === "COMPANY_DOCUMENT_NOT_FOUND",
    );

    await service.deleteForCompany(document.id, companyId);
    storedKeys.pop();
  });
});
