import express from "express";
import { register, login, getMe } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";  
const router = express.Router();

router.post("/register", register);
router.get("/me", authMiddleware, getMe);
router.post("/login", login);

export { router };