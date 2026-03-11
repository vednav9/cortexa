import express from "express";
import {
  registerTeacher,
  loginTeacher,
  logoutTeacher,
  getMyInstitution,
  getAuthorizedCourses,
  getStudentsInAuthorizedCourses,
  uploadNotes,
  getDocuments,
  deleteDocument,
  markDocumentProcessed,
  markDocumentFailed,
  generateMCQs,
  saveMCQSet,
  addToMCQSet,
  getMCQSets,
  assignMCQSet,
  getMCQResults,
} from "../controllers/teacherController.js";
import { authenticate } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// AUTH ROUTES
// ===============================
router.post("/register", registerTeacher);
router.post("/login", loginTeacher);
router.post("/logout", logoutTeacher);

// ===============================
// INSTITUTION ROUTES
// ===============================
router.get("/my-institution", authenticate, getMyInstitution);

// ===============================
// COURSES ROUTES
// ===============================
router.get("/authorized-courses", authenticate, getAuthorizedCourses);

// ===============================
// STUDENTS ROUTES
// ===============================
router.get("/students", authenticate, getStudentsInAuthorizedCourses);

// ===============================
// DOCUMENT/NOTES ROUTES
// ===============================
router.post("/notes/upload", authenticate, upload.single("file"), uploadNotes);
router.get("/notes/:courseId", authenticate, getDocuments);
router.patch("/notes/:documentId/mark-processed", authenticate, markDocumentProcessed);
router.patch("/notes/:documentId/mark-failed", authenticate, markDocumentFailed);
router.delete("/notes/:documentId", authenticate, deleteDocument);

// ===============================
// MCQ ROUTES
// ===============================
router.post("/mcq/generate", authenticate, generateMCQs);
router.post("/mcq/save", authenticate, saveMCQSet);
router.post("/mcq/:mcqSetId/add", authenticate, addToMCQSet);
router.get("/mcq/sets", authenticate, getMCQSets);
router.post("/mcq/:mcqSetId/assign", authenticate, assignMCQSet);
router.get("/mcq/:mcqSetId/results", authenticate, getMCQResults);

export default router;
