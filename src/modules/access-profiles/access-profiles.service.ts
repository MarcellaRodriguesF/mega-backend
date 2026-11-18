import { AccessProfilesRepository } from "./access-profiles.repository.js";
import { ApiError } from "../../shared/http/api-error.js";
import type {
  createAccessProfileSchema,
  updateAccessProfileSchema,
} from "./access-profiles.schemas.js";
import type { z } from "zod";

type CreateAccessProfileData = z.infer<typeof createAccessProfileSchema>;
type UpdateAccessProfileData = z.infer<typeof updateAccessProfileSchema>;

export class AccessProfilesService {
  private repository = new AccessProfilesRepository();

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const profile = await this.repository.findById(id);

    if (!profile) {
      throw new ApiError(
        "Perfil de acesso não encontrado.",
        404,
        "ACCESS_PROFILE_NOT_FOUND",
      );
    }

    return profile;
  }

  async findPermissions() {
    return this.repository.findPermissions();
  }

  async create(data: CreateAccessProfileData) {
    const existingProfile = await this.repository.findByName(data.name);

    if (existingProfile) {
      throw new ApiError(
        "Já existe um perfil com esse nome.",
        409,
        "ACCESS_PROFILE_ALREADY_EXISTS",
      );
    }

    const permissions = await this.validatePermissionCodes(
      data.permissionCodes,
    );

    return this.repository.create({
      name: data.name,
      description: data.description,
      permissionIds: permissions.map((permission) => permission.id),
    });
  }

  async update(id: string, data: UpdateAccessProfileData) {
    const profile = await this.repository.findById(id);

    if (!profile) {
      throw new ApiError(
        "Perfil de acesso não encontrado.",
        404,
        "ACCESS_PROFILE_NOT_FOUND",
      );
    }

    if (data.name) {
      const existingProfile = await this.repository.findByNameExcludingId(
        data.name,
        id,
      );

      if (existingProfile) {
        throw new ApiError(
          "Já existe um perfil com esse nome.",
          409,
          "ACCESS_PROFILE_ALREADY_EXISTS",
        );
      }
    }

    if (data.status === "INACTIVE" && profile.status === "ACTIVE") {
      const usersCount = await this.repository.findUsersCountByProfileId(id);

      if (usersCount > 0) {
        throw new ApiError(
          "Não é possível inativar um perfil que possui usuários vinculados.",
          409,
          "ACCESS_PROFILE_HAS_USERS",
        );
      }
    }

    let permissionIds: string[] | undefined;

    if (data.permissionCodes !== undefined) {
      const permissions = await this.validatePermissionCodes(
        data.permissionCodes,
      );
      permissionIds = permissions.map((permission) => permission.id);
    }

    return this.repository.update(id, {
      name: data.name,
      description: data.description,
      status: data.status,
      permissionIds,
    });
  }

  private async validatePermissionCodes(codes: string[]) {
    const uniqueCodes = [...new Set(codes)];
    const permissions =
      await this.repository.findPermissionsByCodes(uniqueCodes);

    if (permissions.length !== uniqueCodes.length) {
      const validCodes = new Set(
        permissions.map((permission) => permission.code),
      );
      const invalidCodes = uniqueCodes.filter((code) => !validCodes.has(code));

      throw new ApiError(
        `Permissões inválidas: ${invalidCodes.join(", ")}.`,
        400,
        "INVALID_PERMISSION_CODES",
      );
    }

    return permissions;
  }
}
