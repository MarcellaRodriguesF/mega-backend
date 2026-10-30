import express from "express";
import cors from "cors";

import { authRouter } from "./modules/auth/auth.routes.js";
import { companiesRoutes } from "./modules/companies/companies.routes.js";

import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/companies", companiesRoutes);

app.use(errorMiddleware);

export { app };