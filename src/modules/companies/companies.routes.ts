import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { CompaniesController } from "./companies.controller.js";

const companiesRoutes = Router();
const companiesController = new CompaniesController();

companiesRoutes.post("/", authMiddleware, (req, res, next) => {
  companiesController.create(req, res).catch(next);
});

companiesRoutes.get("/", authMiddleware, (req, res, next) => {
  companiesController.findAll(req, res).catch(next);
});

companiesRoutes.get("/:id", authMiddleware, (req, res, next) => {
  companiesController.findById(req, res).catch(next);
});

companiesRoutes.patch("/:id", authMiddleware, (req, res, next) => {
  companiesController.update(req, res).catch(next);
});

export { companiesRoutes };
