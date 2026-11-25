import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";
import { ActivitiesController } from "./activities.controller.js";

const activitiesRoutes = Router();
const controller = new ActivitiesController();

activitiesRoutes.use(authMiddleware);

activitiesRoutes.get(
  "/catalog/users",
  authorizePermission(PERMISSIONS.ACTIVITIES_ASSIGN),
  (req, res, next) => controller.listAssignableUsers(req, res).catch(next),
);

activitiesRoutes.get(
  "/",
  authorizePermission(PERMISSIONS.ACTIVITIES),
  (req, res, next) => controller.findAll(req, res).catch(next),
);

activitiesRoutes.post(
  "/",
  authorizePermission(PERMISSIONS.ACTIVITIES_CREATE),
  (req, res, next) => controller.create(req, res).catch(next),
);

activitiesRoutes.post(
  "/:id/assignments",
  authorizePermission(PERMISSIONS.ACTIVITIES_ASSIGN),
  (req, res, next) => controller.assign(req, res).catch(next),
);

activitiesRoutes.delete(
  "/:id/assignments/:assignmentId",
  authorizePermission(PERMISSIONS.ACTIVITIES_ASSIGN),
  (req, res, next) => controller.removeAssignment(req, res).catch(next),
);

activitiesRoutes.post(
  "/:id/placement",
  authorizePermission(PERMISSIONS.ACTIVITIES_LINK),
  (req, res, next) => controller.place(req, res).catch(next),
);

activitiesRoutes.post(
  "/:id/detach",
  authorizePermission(PERMISSIONS.ACTIVITIES_LINK),
  (req, res, next) => controller.detach(req, res).catch(next),
);

activitiesRoutes.post(
  "/:id/start",
  authorizePermission(PERMISSIONS.ACTIVITIES),
  (req, res, next) => controller.start(req, res).catch(next),
);

activitiesRoutes.post(
  "/:id/complete",
  authorizePermission(PERMISSIONS.ACTIVITIES),
  (req, res, next) => controller.complete(req, res).catch(next),
);

activitiesRoutes.get(
  "/:id",
  authorizePermission(PERMISSIONS.ACTIVITIES),
  (req, res, next) => controller.findById(req, res).catch(next),
);

activitiesRoutes.patch(
  "/:id",
  authorizePermission(PERMISSIONS.ACTIVITIES_UPDATE),
  (req, res, next) => controller.update(req, res).catch(next),
);

export { activitiesRoutes };
