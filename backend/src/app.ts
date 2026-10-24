import express from "express";
import cors from "cors";

import { router as authRouter } from "./routes/authRoutes";
import eventRouter from "./routes/eventRoutes";
import venueRoutes from "./routes/venueRoutes";
import registrationRouter from "./routes/registrationRoutes";
import registrationFieldRoutes from "./routes/registrationFieldRoutes";

const app = express();

// Allow requests from the React frontend
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Parse incoming JSON requests
app.use(express.json());

// Register existing API routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/venues", venueRoutes);
app.use("/api/registrations", registrationRouter);
app.use("/api", registrationFieldRoutes);

export default app;