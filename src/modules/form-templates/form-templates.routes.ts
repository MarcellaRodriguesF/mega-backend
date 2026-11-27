import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { TEMPLATES_ACCESS_PERMISSION } from "../templates/templates.constants.js";
import { FormTemplatesController } from "./form-templates.controller.js";

const formTemplatesRoutes = Router();
const formTemplatesController = new FormTemplatesController();

formTemplatesRoutes.use(authMiddleware);
formTemplatesRoutes.use(authorizePermission(TEMPLATES_ACCESS_PERMISSION));

formTemplatesRoutes.post("/", (req, res, next) => {
  formTemplatesController.create(req, res).catch(next);
});

formTemplatesRoutes.get("/", (req, res, next) => {
  formTemplatesController.findAll(req, res).catch(next);
});

formTemplatesRoutes.put("/:formTemplateId/fields/reorder", (req, res, next) => {
  formTemplatesController.reorderFields(req, res).catch(next);
});

formTemplatesRoutes.post("/:formTemplateId/fields", (req, res, next) => {
  formTemplatesController.createField(req, res).catch(next);
});

formTemplatesRoutes.patch("/:formTemplateId/fields/:fieldId", (req, res, next) => {
  formTemplatesController.updateField(req, res).catch(next);
});

formTemplatesRoutes.delete("/:formTemplateId/fields/:fieldId", (req, res, next) => {
  formTemplatesController.deleteField(req, res).catch(next);
});

formTemplatesRoutes.get("/:id", (req, res, next) => {
  formTemplatesController.findById(req, res).catch(next);
});

formTemplatesRoutes.put("/:id", (req, res, next) => {
  formTemplatesController.update(req, res).catch(next);
});

formTemplatesRoutes.patch("/:id/status", (req, res, next) => {
  formTemplatesController.updateStatus(req, res).catch(next);
});

formTemplatesRoutes.delete("/:id", (req, res, next) => {
  formTemplatesController.delete(req, res).catch(next);
});

export { formTemplatesRoutes };
