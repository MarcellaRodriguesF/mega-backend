import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { ProviderContactsController } from "./provider-contacts.controller.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const providerContactsRoutes = Router({ mergeParams: true });
const providerContactsController = new ProviderContactsController();

providerContactsRoutes.post(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerContactsController.create(req, res).catch(next);
  },
);

providerContactsRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerContactsController.findAllByProvider(req, res).catch(next);
  },
);

providerContactsRoutes.get(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerContactsController.findById(req, res).catch(next);
  },
);

providerContactsRoutes.patch(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerContactsController.update(req, res).catch(next);
  },
);

providerContactsRoutes.delete(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerContactsController.delete(req, res).catch(next);
  },
);

export { providerContactsRoutes };
