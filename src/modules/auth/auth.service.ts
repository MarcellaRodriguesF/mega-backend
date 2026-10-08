import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../../database/prisma.js";
import type { LoginInput } from "./auth.schemas.js";

export class AuthService {
  async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        accessProfile: true,
      },
    });

    if (!user) {
      throw new Error("Credenciais inválidas.");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Usuário inativo.");
    }

    const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordIsValid) {
      throw new Error("Credenciais inválidas.");
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        accessProfileId: user.accessProfileId,
      },
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as NonNullable<
          jwt.SignOptions["expiresIn"]
        >,
      },
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        accessProfile: {
          id: user.accessProfile.id,
          name: user.accessProfile.name,
        },
      },
    };
  }
}
