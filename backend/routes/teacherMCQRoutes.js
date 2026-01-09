import express from "express";
import {
    uploadNotes,
    getDocuments,
    deleteDocument,
    generateMCQs,
    saveMCQSet,
    addToMCQSet,
    getMCQSets,
    assignMCQSet,
    getMCQResults
} from "../controllers/teacherMCQController.js";
import { authenticate } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Document/Notes routes
router.post("/notes/upload", authenticate, upload.single("file"), uploadNotes);
router.get("/notes/:courseId", authenticate, getDocuments);
router.delete("/notes/:documentId", authenticate, deleteDocument);

// MCQ routes
router.post("/mcq/generate", authenticate, generateMCQs);
router.post("/mcq/save", authenticate, saveMCQSet);
router.post("/mcq/:mcqSetId/add", authenticate, addToMCQSet);
router.get("/mcq/sets", authenticate, getMCQSets);
router.post("/mcq/:mcqSetId/assign", authenticate, assignMCQSet);
router.get("/mcq/:mcqSetId/results", authenticate, getMCQResults);

export default router;
