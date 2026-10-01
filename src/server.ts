import express from "express";

const app = express();

app.use(express.json());

const PORT = 3000;

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "mega-backend",
  });
});

app.listen(PORT, () => {
  console.log(`MEGA Backend rodando na porta ${PORT}`);
});