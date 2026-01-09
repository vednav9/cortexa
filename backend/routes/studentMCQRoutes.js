import express from "express";
import {
    getAssignedMCQs,
    getMCQSetDetails,
    submitMCQAttempt,
    getAttemptResults
} from "../controllers/studentMCQController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Student MCQ routes
router.get("/mcq/assigned", authenticate, getAssignedMCQs);
router.get("/mcq/:mcqSetId/details", authenticate, getMCQSetDetails);
router.post("/mcq/:mcqSetId/submit", authenticate, submitMCQAttempt);
router.get("/mcq/attempt/:attemptId/results", authenticate, getAttemptResults);

export default router;
