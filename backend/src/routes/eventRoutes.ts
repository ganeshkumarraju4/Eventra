import { Router } from "express";
import {
    createEvent,
    approveEvent,
    rejectEvent,
    getApprovedEvents,
    getEvent
} from "../controllers/eventController";
import {
    createEventChangeRequest
} from "../controllers/eventChangeRequestController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();

router.post("/", authMiddleware, createEvent);

router.get(
    "/:eventId",
    authMiddleware,
    getEvent
);

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
router.post(
    "/:eventId/change-requests",
    authMiddleware,
    createEventChangeRequest
);
router.get("/", authMiddleware, getApprovedEvents);

export default router;