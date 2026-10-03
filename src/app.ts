import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);

export { app };
