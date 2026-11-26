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
    getRecentlyCompletedEvents,
    submitEventFeedback
} from "../controllers/eventFeedbackController";
import { savePostEventContent } from "../controllers/postEventContentController";
import { uploadEventCover } from "../controllers/eventCoverController";
import multer from "multer";
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
const uploadPostEventPhotos = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 8
    },
    fileFilter: (_req, file, callback) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            callback(new Error("Only JPEG, PNG, and WebP images are supported"));
            return;
        }
        callback(null, true);
    }
}).array("photos", 8);
const uploadEventCoverImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            callback(new Error("Only JPEG, PNG, and WebP images are supported"));
            return;
        }
        callback(null, true);
    }
}).single("coverImage");

// ── Public routes (no auth) ────────────────────────────────────────────────
// Must be declared BEFORE /:eventId so Express doesn't treat "/" as a param.
router.get("/", getApprovedEvents);
router.get("/completed", getRecentlyCompletedEvents);

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
router.post("/:eventId/feedback", authMiddleware, submitEventFeedback);
router.put("/:eventId/cover-image", authMiddleware, (req, res, next) => {
    uploadEventCoverImage(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json({
                message: "Cover image must be no larger than 5 MB"
            });
        }
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        next();
    });
}, uploadEventCover);
router.post(
    "/:eventId/post-event-content",
    authMiddleware,
    (req, res, next) => {
        uploadPostEventPhotos(req, res, (error) => {
            if (error instanceof multer.MulterError) {
                return res.status(400).json({
                    message: "Upload up to 8 images, each no larger than 5 MB"
                });
            }
            if (error) {
                return res.status(400).json({
                    message: error.message
                });
            }
            next();
        });
    },
    savePostEventContent
);
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
