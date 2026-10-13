import { Router } from "express";
import {
    createEvent,
    approveEvent,
    rejectEvent,
    getApprovedEvents,
    getEvent,
    updateEvent,
    cancelEvent
} from "../controllers/eventController";
import {
    createEventChangeRequest, getMyEventChangeRequests
} from "../controllers/eventChangeRequestController";
import {
    getPendingEventChangeRequests,approveEventChangeRequest,
    rejectEventChangeRequest
} from "../controllers/adminEventChangeRequestController";
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
router.patch(
    "/:eventId",
    authMiddleware,
    updateEvent
);
router.patch(
    "/:eventId/cancel",
    authMiddleware,
    cancelEvent
);
router.post(
    "/:eventId/change-requests",
    authMiddleware,
    createEventChangeRequest
);
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
router.get(
    "/:eventId/change-requests",
    authMiddleware,
    getMyEventChangeRequests
);
router.get("/", authMiddleware, getApprovedEvents);

export default router;