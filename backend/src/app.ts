import express from "express";
import { router as authRouter } from "./routes/authRoutes";
import eventRouter from "./routes/eventRoutes";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);

export default app;