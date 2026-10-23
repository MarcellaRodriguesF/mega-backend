import type { Request, Response } from "express";

import { loginSchema } from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";
import { successResponse } from "../../shared/http/api-response.js";

export class AuthController {
  private readonly authService = new AuthService();

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await this.authService.login(input);

    res.cookie("mega_session", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    return successResponse(
      res,
      { user: result.user },
      "Login realizado com sucesso.",
    );
  }
}
