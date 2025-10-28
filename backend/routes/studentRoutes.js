import express from "express";
import { registerStudent, loginStudent } from "../controllers/studentController.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);

router.get("/check-auth", authenticate);

export default router;
