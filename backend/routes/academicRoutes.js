// routes/academicRoutes.js
import express from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getFaculty,
} from "../controllers/academicController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

/* ====================================
   DEPARTMENTS ROUTES
==================================== */
router.get("/institutions/:institutionId/departments", authenticate, getDepartments);
router.post("/institutions/:institutionId/departments", authenticate, authorizeRoles("admin"), createDepartment);
router.put("/departments/:departmentId", authenticate, authorizeRoles("admin"), updateDepartment);
router.delete("/departments/:departmentId", authenticate, authorizeRoles("admin"), deleteDepartment);

/* ====================================
   COURSES ROUTES
==================================== */
router.get("/institutions/:institutionId/courses", authenticate, getCourses);
router.post("/institutions/:institutionId/courses", authenticate, authorizeRoles("admin"), createCourse);
router.put("/courses/:courseId", authenticate, authorizeRoles("admin"), updateCourse);
router.delete("/courses/:courseId", authenticate, authorizeRoles("admin"), deleteCourse);

/* ====================================
   SEMESTERS ROUTES
==================================== */
router.get("/institutions/:institutionId/semesters", authenticate, getSemesters);
router.post("/institutions/:institutionId/semesters", authenticate, authorizeRoles("admin"), createSemester);
router.put("/semesters/:semesterId", authenticate, authorizeRoles("admin"), updateSemester);
router.delete("/semesters/:semesterId", authenticate, authorizeRoles("admin"), deleteSemester);

/* ====================================
   ACADEMIC CALENDAR ROUTES
==================================== */
router.get("/institutions/:institutionId/calendar", authenticate, getCalendarEvents);
router.post("/institutions/:institutionId/calendar", authenticate, authorizeRoles("admin"), createCalendarEvent);
router.put("/calendar/:eventId", authenticate, authorizeRoles("admin"), updateCalendarEvent);
router.delete("/calendar/:eventId", authenticate, authorizeRoles("admin"), deleteCalendarEvent);

/* ====================================
   FACULTY ROUTES
==================================== */
router.get("/institutions/:institutionId/faculty", authenticate, getFaculty);

export default router;
