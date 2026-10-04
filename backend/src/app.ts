import express from "express";
import { router as authRouter } from "./routes/authRoutes";
import eventRouter from "./routes/eventRoutes";
import registrationRouter from "./routes/registrationRoutes";
const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/registrations", registrationRouter);

export default app;