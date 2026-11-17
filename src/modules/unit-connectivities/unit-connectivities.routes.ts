
import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { UnitConnectivitiesController } from "./unit-connectivities.controller.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const unitConnectivitiesRoutes = Router();
const controller = new UnitConnectivitiesController();

unitConnectivitiesRoutes.post(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    controller.create(req, res).catch(next);
  },
);

unitConnectivitiesRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    controller.findAll(req, res).catch(next);
  },
);

unitConnectivitiesRoutes.get(
  "/unit/:unitId",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    controller.findByUnitId(req, res).catch(next);
  },
);

unitConnectivitiesRoutes.get(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    controller.findById(req, res).catch(next);
  },
);

unitConnectivitiesRoutes.patch(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    controller.update(req, res).catch(next);
  },
);

unitConnectivitiesRoutes.delete(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    controller.delete(req, res).catch(next);
  },
);

export { unitConnectivitiesRoutes };
