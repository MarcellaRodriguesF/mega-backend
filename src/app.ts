import express from "express";
import cors from "cors";

import { authRouter } from "./modules/auth/auth.routes.js";
import { companiesRoutes } from "./modules/companies/companies.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";

import { errorMiddleware } from "./middlewares/error.middleware.js";
import { accessProfilesRoutes } from "./modules/access-profiles/access-profiles.routes.js";

import { providersRoutes } from "./modules/providers/providers.routes.js";
import { unitsRoutes } from "./modules/units/units.routes.js";
import { unitConnectivitiesRoutes } from "./modules/unit-connectivities/unit-connectivities.routes.js";
import { geocodingRoutes } from "./modules/geocoding/geocoding.routes.js";
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
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/access-profiles", accessProfilesRoutes);
app.use("/api/v1/providers", providersRoutes);
app.use("/api/v1/units", unitsRoutes);
app.use("/api/v1/unit-connectivities", unitConnectivitiesRoutes);
app.use("/api/v1/geocoding", geocodingRoutes);
app.use(errorMiddleware);

export { app };
