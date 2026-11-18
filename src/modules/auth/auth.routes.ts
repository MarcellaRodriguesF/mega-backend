import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { AuthController } from "./auth.controller.js";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/login", (req, res, next) => {
  authController.login(req, res).catch(next);
});

authRouter.get("/me", authMiddleware, (req, res, next) => {
  authController.me(req, res).catch(next);
});

authRouter.post("/logout", (req, res, next) => {
  authController.logout(req, res).catch(next);
});

export { authRouter };
