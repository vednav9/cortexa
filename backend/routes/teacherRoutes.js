import express from "express";
import {
  registerTeacher,
  loginTeacher,
  logoutTeacher,
  getMyInstitution,
  getAuthorizedCourses,
  getStudentsInAuthorizedCourses,
} from "../controllers/teacherController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Auth
router.post("/register", registerTeacher);
router.post("/login", loginTeacher);
router.post("/logout", logoutTeacher);

// Institution (1 teacher → 1 institution)
router.get("/my-institution", authenticate, getMyInstitution);
// router.delete("/leave-institution", authenticate, leaveInstitution);

// Courses
router.get("/authorized-courses", authenticate, getAuthorizedCourses);

// Students
router.get("/students", authenticate, getStudentsInAuthorizedCourses);

export default router;
