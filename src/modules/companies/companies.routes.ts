import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";

import { CompaniesController } from "./companies.controller.js";
import { contactsRoutes } from "../contacts/contacts.routes.js";
import { PERMISSIONS } from "../authorization/authorization.permissions.js";

const companiesRoutes = Router();
const companiesController = new CompaniesController();

// Rotas de contatos
companiesRoutes.use("/:companyId/contacts", contactsRoutes);

// Rotas de empresas
companiesRoutes.post("/", authMiddleware, (req, res, next) => {
  companiesController.create(req, res).catch(next);
});

companiesRoutes.get(
  "/",
  authMiddleware,
  authorizePermission(PERMISSIONS.CLIENTS),
  (req, res, next) => {
    companiesController.findAll(req, res).catch(next);
  },
);

companiesRoutes.get("/:id", authMiddleware, (req, res, next) => {
  companiesController.findById(req, res).catch(next);
});

companiesRoutes.patch("/:id", authMiddleware, (req, res, next) => {
  companiesController.update(req, res).catch(next);
});

companiesRoutes.delete("/:id", authMiddleware, (req, res, next) => {
  companiesController.delete(req, res).catch(next);
});

export { companiesRoutes };
