import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { AuthController } from "./auth.controller.js";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/login", (req, res) =>
  authController.login(req, res),
);
authRouter.get("/me", authMiddleware, (req, res) => {
  return res.json({
    user: req.user,
  });
});

export { authRouter };