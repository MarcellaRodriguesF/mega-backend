import bcrypt from "bcrypt";

import { ApiError } from "../../shared/http/api-error.js";
import { UsersRepository } from "./users.repository.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schemas.js";

export class UsersService {
  private readonly usersRepository = new UsersRepository();

  async create(data: CreateUserInput) {
    const existingUser = await this.usersRepository.findByEmail(data.email);

    if (existingUser) {
      throw new ApiError(
        "Já existe um usuário cadastrado com este e-mail.",
        409,
        "USER_EMAIL_ALREADY_EXISTS",
      );
    }

    const accessProfile = await this.usersRepository.findAccessProfileById(
      data.accessProfileId,
    );

    if (!accessProfile || accessProfile.status !== "ACTIVE") {
      throw new ApiError(
        "Perfil de acesso não encontrado ou inativo.",
        400,
        "ACCESS_PROFILE_INVALID",
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.usersRepository.create({
      ...(data.name !== undefined && { name: data.name }),
      email: data.email,
      passwordHash,
      accessProfileId: data.accessProfileId,
    });
  }

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new ApiError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }

    return user;
  }

  async update(id: string, data: UpdateUserInput) {
    await this.findById(id);

    if (data.email) {
      const existingUser = await this.usersRepository.findByEmailExcludingId(
        data.email,
        id,
      );

      if (existingUser) {
        throw new ApiError(
          "Já existe outro usuário cadastrado com este e-mail.",
          409,
          "USER_EMAIL_ALREADY_EXISTS",
        );
      }
    }

    if (data.accessProfileId) {
      const accessProfile = await this.usersRepository.findAccessProfileById(
        data.accessProfileId,
      );

      if (!accessProfile || accessProfile.status !== "ACTIVE") {
        throw new ApiError(
          "Perfil de acesso não encontrado ou inativo.",
          400,
          "ACCESS_PROFILE_INVALID",
        );
      }
    }

    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    return this.usersRepository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(passwordHash !== undefined && { passwordHash }),
      ...(data.accessProfileId !== undefined && {
        accessProfileId: data.accessProfileId,
      }),
      ...(data.status !== undefined && { status: data.status }),
    });
  }
}
