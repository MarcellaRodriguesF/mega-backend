import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { PERMISSIONS } from "../authorization/authorization.permissions.js";
import { UsersController } from "./users.controller.js";

const usersRoutes = Router();
const usersController = new UsersController();

usersRoutes.post(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.USERS),
  (req, res, next) => {
    usersController.create(req, res).catch(next);
  },
);

usersRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.USERS),
  (req, res, next) => {
    usersController.findAll(req, res).catch(next);
  },
);

usersRoutes.get(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.USERS),
  (req, res, next) => {
    usersController.findById(req, res).catch(next);
  },
);

usersRoutes.patch(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.USERS),
  (req, res, next) => {
    usersController.update(req, res).catch(next);
  },
);

export { usersRoutes };
