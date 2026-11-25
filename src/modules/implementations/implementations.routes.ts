import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { IMPLEMENTATIONS_ACCESS_PERMISSION } from "./implementations.constants.js";
import { ImplementationsController } from "./implementations.controller.js";

const implementationsRoutes = Router();
const implementationsController = new ImplementationsController();

implementationsRoutes.use(authMiddleware);
implementationsRoutes.use(authorizePermission(IMPLEMENTATIONS_ACCESS_PERMISSION));

implementationsRoutes.get("/catalog/templates", (req, res, next) => {
  implementationsController.listPublishedTemplates(req, res).catch(next);
});

implementationsRoutes.get("/catalog/units", (req, res, next) => {
  implementationsController.listUnits(req, res).catch(next);
});

implementationsRoutes.post("/", (req, res, next) => {
  implementationsController.create(req, res).catch(next);
});

implementationsRoutes.get("/", (req, res, next) => {
  implementationsController.findAll(req, res).catch(next);
});

implementationsRoutes.get("/:id", (req, res, next) => {
  implementationsController.findById(req, res).catch(next);
});

export { implementationsRoutes };
