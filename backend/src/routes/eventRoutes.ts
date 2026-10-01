import { Router } from "express";
import {
    createEvent,
    approveEvent,
    rejectEvent
} from "../controllers/eventController";

import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();

router.post("/", authMiddleware, createEvent);

router.patch(
    "/:eventId/approve",
    authMiddleware,
    adminMiddleware,
    approveEvent
);

router.patch(
    "/:eventId/reject",
    authMiddleware,
    adminMiddleware,
    rejectEvent
);

export default router;