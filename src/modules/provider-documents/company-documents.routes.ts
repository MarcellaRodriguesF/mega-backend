import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { uploadSingleFile } from "../../middlewares/upload.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";
import { CompanyDocumentsController } from "./company-documents.controller.js";

const companyDocumentsRoutes = Router({ mergeParams: true });
const controller = new CompanyDocumentsController();
const authorizeClients = [
  authMiddleware,
  authorizePermission(PERMISSIONS.CLIENTS),
];

companyDocumentsRoutes.post(
  "/",
  ...authorizeClients,
  uploadSingleFile,
  (req, res, next) => controller.create(req, res).catch(next),
);

companyDocumentsRoutes.get("/", ...authorizeClients, (req, res, next) =>
  controller.findAll(req, res).catch(next),
);

companyDocumentsRoutes.get("/:id/file", ...authorizeClients, (req, res, next) =>
  controller.download(req, res).catch(next),
);

companyDocumentsRoutes.get("/:id", ...authorizeClients, (req, res, next) =>
  controller.findById(req, res).catch(next),
);

companyDocumentsRoutes.patch(
  "/:id",
  ...authorizeClients,
  uploadSingleFile,
  (req, res, next) => controller.update(req, res).catch(next),
);

companyDocumentsRoutes.delete("/:id", ...authorizeClients, (req, res, next) =>
  controller.delete(req, res).catch(next),
);

export { companyDocumentsRoutes };
