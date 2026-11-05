import { Router } from "express";
import {
    createEvent,
    approveEvent,
    rejectEvent,
    getApprovedEvents,
    getAdminEvents,
    getEvent,
    updateEvent,
    cancelEvent,
    getMyEvents
} from "../controllers/eventController";
import {
    createEventChangeRequest, getMyEventChangeRequests
} from "../controllers/eventChangeRequestController";
import {
    getPendingEventChangeRequests, approveEventChangeRequest,
    rejectEventChangeRequest
} from "../controllers/adminEventChangeRequestController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";


const router = Router();

// ── Public routes (no auth) ────────────────────────────────────────────────
// Must be declared BEFORE /:eventId so Express doesn't treat "/" as a param.
router.get("/", getApprovedEvents);

// ── Fixed-path authenticated routes ───────────────────────────────────────
router.post("/", authMiddleware, createEvent);
router.get("/my", authMiddleware, getMyEvents);
router.get("/admin", authMiddleware, adminMiddleware, getAdminEvents);

// Admin change-request routes — also fixed paths, must precede /:eventId
router.get(
    "/admin/change-requests",
    authMiddleware,
    adminMiddleware,
    getPendingEventChangeRequests
);
router.patch(
    "/admin/change-requests/:requestId/approve",
    authMiddleware,
    adminMiddleware,
    approveEventChangeRequest
);
router.patch(
    "/admin/change-requests/:requestId/reject",
    authMiddleware,
    adminMiddleware,
    rejectEventChangeRequest
);

// ── Dynamic /:eventId routes — must come AFTER all fixed-path routes ───────
router.get(
    "/:eventId",
    optionalAuthMiddleware,
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
router.patch(
    "/:eventId/cancel",
    authMiddleware,
    cancelEvent
);
router.patch(
    "/:eventId",
    authMiddleware,
    updateEvent
);
router.post(
    "/:eventId/change-requests",
    authMiddleware,
    createEventChangeRequest
);
router.get(
    "/:eventId/change-requests",
    authMiddleware,
    getMyEventChangeRequests
);

export default router;
