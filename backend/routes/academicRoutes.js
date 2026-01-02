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
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/* ====================================
   DEPARTMENTS ROUTES
==================================== */
router.get("/institutions/:institutionId/departments", getDepartments);
router.post("/institutions/:institutionId/departments", authenticate, createDepartment);
router.put("/departments/:departmentId", authenticate, updateDepartment);
router.delete("/departments/:departmentId", authenticate, deleteDepartment);

/* ====================================
   COURSES ROUTES
==================================== */
router.get("/institutions/:institutionId/courses", getCourses);
router.post("/institutions/:institutionId/courses", authenticate, createCourse);
router.put("/courses/:courseId", authenticate, updateCourse);
router.delete("/courses/:courseId", authenticate, deleteCourse);

/* ====================================
   SEMESTERS ROUTES
==================================== */
router.get("/institutions/:institutionId/semesters", getSemesters);
router.post("/institutions/:institutionId/semesters", authenticate, createSemester);
router.put("/semesters/:semesterId", authenticate, updateSemester);
router.delete("/semesters/:semesterId", authenticate, deleteSemester);

/* ====================================
   ACADEMIC CALENDAR ROUTES
==================================== */
router.get("/institutions/:institutionId/calendar", getCalendarEvents);
router.post("/institutions/:institutionId/calendar", authenticate, createCalendarEvent);
router.put("/calendar/:eventId", authenticate, updateCalendarEvent);
router.delete("/calendar/:eventId", authenticate, deleteCalendarEvent);

/* ====================================
   FACULTY ROUTES
==================================== */
router.get("/institutions/:institutionId/faculty", getFaculty);

export default router;
