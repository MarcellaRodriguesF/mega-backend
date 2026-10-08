import type { Request, Response } from "express";

import { loginSchema } from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";

export class AuthController {
  private readonly authService = new AuthService();

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);

    const result = await this.authService.login(input);

    return res.status(200).json(result);
  }
}
