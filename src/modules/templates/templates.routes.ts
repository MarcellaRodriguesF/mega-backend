import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizePermission } from "../../middlewares/authorization.middleware.js";
import { TemplatesController } from "./templates.controller.js";
import { TEMPLATES_ACCESS_PERMISSION } from "./templates.constants.js";

const templatesRoutes = Router();
const templatesController = new TemplatesController();

templatesRoutes.use(authMiddleware);
templatesRoutes.use(authorizePermission(TEMPLATES_ACCESS_PERMISSION));

templatesRoutes.post("/", (req, res, next) => {
  templatesController.create(req, res).catch(next);
});

templatesRoutes.get("/", (req, res, next) => {
  templatesController.findAll(req, res).catch(next);
});

templatesRoutes.put("/:templateId/stages/reorder", (req, res, next) => {
  templatesController.reorderStages(req, res).catch(next);
});

templatesRoutes.post("/:templateId/stages", (req, res, next) => {
  templatesController.createStage(req, res).catch(next);
});

templatesRoutes.patch("/:templateId/stages/:stageId", (req, res, next) => {
  templatesController.updateStage(req, res).catch(next);
});

templatesRoutes.delete("/:templateId/stages/:stageId", (req, res, next) => {
  templatesController.deleteStage(req, res).catch(next);
});

templatesRoutes.put(
  "/:templateId/stages/:stageId/activities/reorder",
  (req, res, next) => {
    templatesController.reorderActivities(req, res).catch(next);
  },
);

templatesRoutes.post("/:templateId/stages/:stageId/activities", (req, res, next) => {
  templatesController.createActivity(req, res).catch(next);
});

templatesRoutes.patch(
  "/:templateId/stages/:stageId/activities/:activityId",
  (req, res, next) => {
    templatesController.updateActivity(req, res).catch(next);
  },
);

templatesRoutes.delete(
  "/:templateId/stages/:stageId/activities/:activityId",
  (req, res, next) => {
    templatesController.deleteActivity(req, res).catch(next);
  },
);

templatesRoutes.put(
  "/:templateId/stages/:stageId/activities/:activityId/requirements/reorder",
  (req, res, next) => {
    templatesController.reorderRequirements(req, res).catch(next);
  },
);

templatesRoutes.post(
  "/:templateId/stages/:stageId/activities/:activityId/requirements",
  (req, res, next) => {
    templatesController.createRequirement(req, res).catch(next);
  },
);

templatesRoutes.patch(
  "/:templateId/stages/:stageId/activities/:activityId/requirements/:requirementId",
  (req, res, next) => {
    templatesController.updateRequirement(req, res).catch(next);
  },
);

templatesRoutes.delete(
  "/:templateId/stages/:stageId/activities/:activityId/requirements/:requirementId",
  (req, res, next) => {
    templatesController.deleteRequirement(req, res).catch(next);
  },
);

templatesRoutes.get("/:id", (req, res, next) => {
  templatesController.findById(req, res).catch(next);
});

templatesRoutes.put("/:id", (req, res, next) => {
  templatesController.update(req, res).catch(next);
});

templatesRoutes.patch("/:id/status", (req, res, next) => {
  templatesController.updateStatus(req, res).catch(next);
});

templatesRoutes.delete("/:id", (req, res, next) => {
  templatesController.delete(req, res).catch(next);
});

export { templatesRoutes };
