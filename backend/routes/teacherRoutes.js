import express from "express";
import { registerTeacher, loginTeacher, logoutTeacher, getTeacherProfile } from "../controllers/teacherController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerTeacher);
router.post("/login", loginTeacher);
router.post("/logout", logoutTeacher);
router.get("/me", authenticate, getTeacherProfile);
export default router;