import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";
import { ImplementationsController } from "./implementations.controller.js";

const implementationsRoutes = Router();
const controller = new ImplementationsController();

implementationsRoutes.use(authMiddleware);

implementationsRoutes.get(
  "/catalog/templates",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS),
  (req, res, next) => controller.listPublishedTemplates(req, res).catch(next),
);

implementationsRoutes.get(
  "/catalog/templates/:id",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS),
  (req, res, next) => controller.previewTemplate(req, res).catch(next),
);

implementationsRoutes.get(
  "/catalog/units",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS),
  (req, res, next) => controller.listUnits(req, res).catch(next),
);

implementationsRoutes.get(
  "/catalog/companies",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS),
  (req, res, next) => controller.listCompanies(req, res).catch(next),
);

implementationsRoutes.post(
  "/",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS_CREATE),
  (req, res, next) => controller.create(req, res).catch(next),
);

implementationsRoutes.get(
  "/",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS),
  (req, res, next) => controller.findAll(req, res).catch(next),
);

implementationsRoutes.post(
  "/:id/cancel",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS_CANCEL),
  (req, res, next) => controller.cancel(req, res).catch(next),
);

implementationsRoutes.put(
  "/:id/stages/reorder",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS_MANAGE_STAGES),
  (req, res, next) => controller.reorderStages(req, res).catch(next),
);

implementationsRoutes.post(
  "/:id/stages",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS_MANAGE_STAGES),
  (req, res, next) => controller.createStage(req, res).catch(next),
);

implementationsRoutes.patch(
  "/:id/stages/:stageId",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS_MANAGE_STAGES),
  (req, res, next) => controller.updateStage(req, res).catch(next),
);

implementationsRoutes.delete(
  "/:id/stages/:stageId",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS_MANAGE_STAGES),
  (req, res, next) => controller.deleteStage(req, res).catch(next),
);

implementationsRoutes.get(
  "/:id",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS),
  (req, res, next) => controller.findById(req, res).catch(next),
);

implementationsRoutes.patch(
  "/:id",
  authorizePermission(PERMISSIONS.IMPLEMENTATIONS_UPDATE),
  (req, res, next) => controller.update(req, res).catch(next),
);

export { implementationsRoutes };
