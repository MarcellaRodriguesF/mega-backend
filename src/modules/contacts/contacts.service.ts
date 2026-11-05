import { ApiError } from "../../shared/http/api-error.js";
import { CompaniesRepository } from "../companies/companies.repository.js";
import { ContactsRepository } from "./contacts.repository.js";

import type {
  CreateContactInput,
  UpdateContactInput,
} from "./contacts.schemas.js";

export class ContactsService {
  private readonly contactsRepository = new ContactsRepository();
  private readonly companiesRepository = new CompaniesRepository();

  async findAllByCompany(companyId: string) {
    await this.ensureCompanyExists(companyId);

    return this.contactsRepository.findAllByCompany(companyId);
  }

  async findById(id: string, companyId: string) {
    await this.ensureCompanyExists(companyId);

    const contact = await this.contactsRepository.findById(id, companyId);

    if (!contact) {
      throw new ApiError("Contato não encontrado.", 404, "CONTACT_NOT_FOUND");
    }

    return contact;
  }

  async create(companyId: string, data: CreateContactInput) {
    await this.ensureCompanyExists(companyId);

    return this.contactsRepository.create({
      ...data,
      companyId,
    });
  }

  async update(id: string, companyId: string, data: UpdateContactInput) {
    await this.findById(id, companyId);

    return this.contactsRepository.update(id, companyId, data);
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);

    return this.contactsRepository.delete(id);
  }

  private async ensureCompanyExists(companyId: string) {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new ApiError("Empresa não encontrada.", 404, "COMPANY_NOT_FOUND");
    }

    return company;
  }
}
