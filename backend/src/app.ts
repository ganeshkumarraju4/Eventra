import express from "express";
import { router as authRouter } from "./routes/authRoutes";
import eventRouter from "./routes/eventRoutes";
import venueRoutes from "./routes/venueRoutes";
import registrationRouter from "./routes/registrationRoutes";
import registrationFieldRoutes from "./routes/registrationFieldRoutes";
const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/venues", venueRoutes);
app.use("/api/registrations", registrationRouter);
app.use("/api", registrationFieldRoutes);
export default app;