import express from "express";
import { register, login, getMe } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";  
const router = express.Router();

router.post("/register", register);
router.get("/me", authMiddleware, getMe);
router.post("/login", login);
router.get(
    "/admin-test",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
        res.json({
            message: "Welcome Admin"
        });
    }
);
export { router };