import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { ContactsController } from "./contacts.controller.js";

const contactsRoutes = Router({ mergeParams: true });
const contactsController = new ContactsController();

contactsRoutes.post("/", authMiddleware, (req, res, next) => {
  contactsController.create(req, res).catch(next);
});

contactsRoutes.get("/", authMiddleware, (req, res, next) => {
  contactsController.findAllByCompany(req, res).catch(next);
});

contactsRoutes.get("/:id", authMiddleware, (req, res, next) => {
  contactsController.findById(req, res).catch(next);
});

contactsRoutes.patch("/:id", authMiddleware, (req, res, next) => {
  contactsController.update(req, res).catch(next);
});

contactsRoutes.delete("/:id", authMiddleware, (req, res, next) => {
  contactsController.delete(req, res).catch(next);
});

export { contactsRoutes };
