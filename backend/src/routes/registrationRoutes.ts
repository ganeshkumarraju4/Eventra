import { Router } from "express";
import { createRegistration ,approveRegistration, rejectRegistration, getMyRegistrations, getEventRegistrations} from "../controllers/registrationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
router.post("/", authMiddleware, createRegistration);

router.patch(
    "/:id/approve",
    authMiddleware,
    approveRegistration
);

router.patch(
    "/:id/reject",
    authMiddleware,
    rejectRegistration
);
router.get("/my",authMiddleware,getMyRegistrations);
router.get("/event/:eventId",authMiddleware,getEventRegistrations);
export default router;