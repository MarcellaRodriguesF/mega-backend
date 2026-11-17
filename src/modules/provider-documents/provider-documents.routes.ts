import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { ProviderDocumentsController } from "./provider-documents.controller.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const providerDocumentsRoutes = Router({ mergeParams: true });
const providerDocumentsController = new ProviderDocumentsController();

providerDocumentsRoutes.post(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerDocumentsController.create(req, res).catch(next);
  },
);

providerDocumentsRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerDocumentsController.findAllByProvider(req, res).catch(next);
  },
);

providerDocumentsRoutes.get(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerDocumentsController.findById(req, res).catch(next);
  },
);

providerDocumentsRoutes.patch(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerDocumentsController.update(req, res).catch(next);
  },
);

providerDocumentsRoutes.delete(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.PROVIDERS),
  (req, res, next) => {
    providerDocumentsController.delete(req, res).catch(next);
  },
);

export { providerDocumentsRoutes };
