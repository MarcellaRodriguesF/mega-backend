import { Router } from "express";
import { accessProfilesController } from "./access-profiles.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const accessProfilesRoutes = Router();

accessProfilesRoutes.use(authMiddleware);
accessProfilesRoutes.use(authorizePermission(PERMISSIONS.ACCESS_PROFILES));

// Catálogo de permissões
accessProfilesRoutes.get("/permissions", (req, res, next) =>
  accessProfilesController.findPermissions(req, res, next),
);

// Perfis
accessProfilesRoutes.get("/", (req, res, next) =>
  accessProfilesController.findAll(req, res, next),
);

accessProfilesRoutes.get("/:id", (req, res, next) =>
  accessProfilesController.findById(req, res, next),
);

accessProfilesRoutes.post("/", (req, res, next) =>
  accessProfilesController.create(req, res, next),
);

accessProfilesRoutes.patch("/:id", (req, res, next) =>
  accessProfilesController.update(req, res, next),
);

export { accessProfilesRoutes };
