import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { ApiError } from "../../shared/http/api-error.js";
import { AuthRepository } from "./auth.repository.js";
import type { LoginInput } from "./auth.schemas.js";
import { AuthorizationRepository } from "../authorization/authorization.repository.js";

export class AuthService {
  private readonly authRepository = new AuthRepository();
  private authorizationRepository = new AuthorizationRepository();

  async login({ email, password }: LoginInput) {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(
        "E-mail ou senha inválidos.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError("Usuário inativo.", 403, "USER_INACTIVE");
    }

    const permissions =
      await this.authorizationRepository.findPermissionCodesByProfileId(
        user.accessProfileId,
      );

    const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordIsValid) {
      throw new ApiError(
        "E-mail ou senha inválidos.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN;

    if (!secret || !expiresIn) {
      throw new ApiError(
        "A autenticação não está configurada corretamente.",
        500,
        "AUTH_CONFIGURATION_ERROR",
      );
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        accessProfileId: user.accessProfileId,
      },
      secret,
      {
        expiresIn: expiresIn as NonNullable<jwt.SignOptions["expiresIn"]>,
      },
    );

    await this.authRepository.updateLastLogin(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        accessProfile: {
          id: user.accessProfile.id,
          name: user.accessProfile.name,
        },
        permissions,
      },
    };
  }

  async me(userId: string) {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new ApiError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError("Usuário inativo.", 403, "USER_INACTIVE");
    }

    return {
      id: user.id,
      email: user.email,
      accessProfile: {
        id: user.accessProfile.id,
        name: user.accessProfile.name,
      },
    };
  }
}
