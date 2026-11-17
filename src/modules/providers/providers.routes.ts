import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { ProvidersController } from "./providers.controller.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const providersRoutes = Router();
const providersController = new ProvidersController();

providersRoutes.post(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providersController.create(req, res).catch(next);
  },
);

providersRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providersController.findAll(req, res).catch(next);
  },
);

providersRoutes.get(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providersController.findById(req, res).catch(next);
  },
);

providersRoutes.patch(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providersController.update(req, res).catch(next);
  },
);

providersRoutes.delete(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providersController.delete(req, res).catch(next);
  },
);

export { providersRoutes };
