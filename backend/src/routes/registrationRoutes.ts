import { Router } from "express";
import { createRegistration } from "../controllers/registrationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
router.post("/", authMiddleware, createRegistration);

export default router;