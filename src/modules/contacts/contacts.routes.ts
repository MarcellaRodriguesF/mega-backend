import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { ContactsController } from "./contacts.controller.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const contactsRoutes = Router({ mergeParams: true });
const contactsController = new ContactsController();

contactsRoutes.post(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.CLIENTS),
  (req, res, next) => {
    contactsController.create(req, res).catch(next);
  },
);

contactsRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.CLIENTS),
  (req, res, next) => {
    contactsController.findAllByCompany(req, res).catch(next);
  },
);

contactsRoutes.get(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.CLIENTS),
  (req, res, next) => {
    contactsController.findById(req, res).catch(next);
  },
);

contactsRoutes.patch(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.CLIENTS),
  (req, res, next) => {
    contactsController.update(req, res).catch(next);
  },
);

contactsRoutes.delete(
  "/:id",
  authMiddleware,
  authorizePermission(PERMISSIONS.CLIENTS),
  (req, res, next) => {
    contactsController.delete(req, res).catch(next);
  },
);

export { contactsRoutes };
