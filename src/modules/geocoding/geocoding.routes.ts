
import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

import { GeocodingController } from "./geocoding.controller.js";

const geocodingRoutes = Router();
const controller = new GeocodingController();

geocodingRoutes.post(
  "/reverse",
  authMiddleware,
  authorizePermission(PERMISSIONS.UNITS),
  (req, res, next) => {
    controller.reverse(req, res).catch(next);
  },
);

export { geocodingRoutes };
