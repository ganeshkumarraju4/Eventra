import express from "express";
import { router as authRouter } from "./routes/authRoutes";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);

export default app;