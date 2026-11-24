import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { RecordStatus } from "../../shared/enums/record-status.enum.js";
import {
  UnitConnectivitiesRepository,
  type UnitConnectivityDb,
} from "./unit-connectivities.repository.js";
import type {
  CreateUnitConnectivityInput,
  UpdateUnitConnectivityInput,
} from "./unit-connectivities.schemas.js";

const ACTIVE_COMBO_CONFLICT = {
  message:
    "Já existe uma conectividade ativa para esta unidade, provedor e tecnologia.",
  statusCode: 409,
  code: "CONNECTIVITY_ALREADY_EXISTS",
} as const;

export class UnitConnectivitiesService {
  private readonly repository = new UnitConnectivitiesRepository();

  async create(data: CreateUnitConnectivityInput) {
    return this.withComboConflict(() => prisma.$transaction(async (tx) => {
      await this.lockUnit(tx, data.unitId);
      await this.assertProvider(tx, data.providerId);

      const active = await this.repository.findActiveByCombo(tx, {
        unitId: data.unitId,
        providerId: data.providerId,
        technology: data.technology,
      });

      if (active) {
        throw new ApiError(
          ACTIVE_COMBO_CONFLICT.message,
          ACTIVE_COMBO_CONFLICT.statusCode,
          ACTIVE_COMBO_CONFLICT.code,
        );
      }

      const inactive = await this.repository.findLatestInactiveByCombo(tx, {
        unitId: data.unitId,
        providerId: data.providerId,
        technology: data.technology,
      });

      if (inactive) {
        return this.repository.update(tx, inactive.id, {
          providerId: data.providerId,
          name: data.name,
          technology: data.technology,
          status: RecordStatus.ACTIVE,
          ...(data.publicIp !== undefined ? { publicIp: data.publicIp } : {}),
          ...(data.observations !== undefined
            ? { observations: data.observations }
            : {}),
        });
      }

      return this.repository.create(tx, {
        ...data,
        status: RecordStatus.ACTIVE,
      });
    }));
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const connectivity = await this.repository.findById(id);

    if (!connectivity) {
      throw new ApiError(
        "Conectividade não encontrada.",
        404,
        "CONNECTIVITY_NOT_FOUND",
      );
    }

    return connectivity;
  }

  async findByUnitId(unitId: string) {
    const unit = await this.repository.findUnitById(unitId);

    if (!unit) {
      throw new ApiError(
        "Unidade não encontrada.",
        404,
        "CONNECTIVITY_UNIT_NOT_FOUND",
      );
    }

    return this.repository.findByUnitId(unitId);
  }

  async update(id: string, data: UpdateUnitConnectivityInput) {
    const current = await this.repository.findById(id);

    if (!current) {
      throw new ApiError(
        "Conectividade não encontrada.",
        404,
        "CONNECTIVITY_NOT_FOUND",
      );
    }

    return this.withComboConflict(() => prisma.$transaction(async (tx) => {
      await this.lockUnit(tx, current.unitId);

      const fresh = await this.repository.findById(id, tx);

      if (!fresh) {
        throw new ApiError(
          "Conectividade não encontrada.",
          404,
          "CONNECTIVITY_NOT_FOUND",
        );
      }

      if (data.providerId) {
        await this.assertProvider(tx, data.providerId);
      }

      const nextProviderId = data.providerId ?? fresh.providerId;
      const nextTechnology = data.technology ?? fresh.technology;
      const comboChanged =
        nextProviderId !== fresh.providerId ||
        nextTechnology !== fresh.technology;

      if (
        fresh.status === RecordStatus.ACTIVE &&
        comboChanged &&
        nextProviderId
      ) {
        const active = await this.repository.findActiveByCombo(tx, {
          unitId: fresh.unitId,
          providerId: nextProviderId,
          technology: nextTechnology,
          excludeId: fresh.id,
        });

        if (active) {
          throw new ApiError(
            ACTIVE_COMBO_CONFLICT.message,
            ACTIVE_COMBO_CONFLICT.statusCode,
            ACTIVE_COMBO_CONFLICT.code,
          );
        }
      }

      return this.repository.update(tx, fresh.id, data);
    }));
  }

  async delete(id: string) {
    const current = await this.repository.findById(id);

    if (!current) {
      throw new ApiError(
        "Conectividade não encontrada.",
        404,
        "CONNECTIVITY_NOT_FOUND",
      );
    }

    return prisma.$transaction(async (tx) => {
      await this.lockUnit(tx, current.unitId);

      const fresh = await this.repository.findById(id, tx);

      if (!fresh) {
        throw new ApiError(
          "Conectividade não encontrada.",
          404,
          "CONNECTIVITY_NOT_FOUND",
        );
      }

      return this.repository.inactivate(tx, fresh.id);
    });
  }

  private async withComboConflict<T>(action: () => Promise<T>) {
    try {
      return await action();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(
          ACTIVE_COMBO_CONFLICT.message,
          ACTIVE_COMBO_CONFLICT.statusCode,
          ACTIVE_COMBO_CONFLICT.code,
        );
      }

      throw error;
    }
  }

  private async lockUnit(db: UnitConnectivityDb, unitId: string) {
    const unit = await this.repository.lockUnit(db, unitId);

    if (!unit) {
      throw new ApiError(
        "Unidade não encontrada.",
        404,
        "CONNECTIVITY_UNIT_NOT_FOUND",
      );
    }

    return unit;
  }

  private async assertProvider(db: UnitConnectivityDb, providerId: string) {
    const provider = await this.repository.findProviderById(providerId, db);

    if (!provider) {
      throw new ApiError(
        "Provedor não encontrado.",
        404,
        "CONNECTIVITY_PROVIDER_NOT_FOUND",
      );
    }
  }
}
