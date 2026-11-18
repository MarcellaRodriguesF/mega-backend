
import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { UnitsController } from "./units.controller.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const unitsRoutes = Router();
const unitsController = new UnitsController();

unitsRoutes.post(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    unitsController.create(req, res).catch(next);
  },
);

unitsRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    unitsController.findAll(req, res).catch(next);
  },
);

unitsRoutes.get(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    unitsController.findById(req, res).catch(next);
  },
);

unitsRoutes.patch(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    unitsController.update(req, res).catch(next);
  },
);

unitsRoutes.delete(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    unitsController.delete(req, res).catch(next);
  },
);

export { unitsRoutes };
