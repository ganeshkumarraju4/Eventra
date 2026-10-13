import { Router } from "express";

import {
    createVenue,
    getVenues,
    getVenue,
    updateVenue,
    deleteVenue
} from "../controllers/venueController";

import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();

// Admin operations
router.post("/", authMiddleware, adminMiddleware, createVenue);

router.patch(
    "/:venueId",
    authMiddleware,
    adminMiddleware,
    updateVenue
);

router.delete(
    "/:venueId",
    authMiddleware,
    adminMiddleware,
    deleteVenue
);

// Authenticated users can view venues
router.get("/", authMiddleware, getVenues);

router.get("/:venueId", authMiddleware, getVenue);

export default router;