import { Router } from "express";
import {
    createEvent,
    approveEvent,
    rejectEvent,
    getApprovedEvents
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
router.get("/", authMiddleware, getApprovedEvents);
console.log("eventRoutes loaded");
export default router;