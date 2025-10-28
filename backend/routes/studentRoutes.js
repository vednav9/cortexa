import express from "express";
import { registerStudent, loginStudent, getUserProfile, logoutStudent } from "../controllers/studentController.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/logout", logoutStudent);

router.get("/check-auth", authenticate);
router.get("/me", authenticate, getUserProfile);

export default router;
