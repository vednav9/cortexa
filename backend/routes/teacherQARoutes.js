import express from 'express';
import teacherQAController from '../controllers/teacherQAController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all questions for courses teacher teaches
router.get('/questions', teacherQAController.getQuestions);

// Get single question with answers
router.get('/questions/:questionId', teacherQAController.getQuestionById);

// Answer a question
router.post('/questions/:questionId/answers', teacherQAController.answerQuestion);

// Accept an answer (mark as resolved)
router.post('/answers/:answerId/accept', teacherQAController.acceptAnswer);

// Get teacher statistics
router.get('/stats', teacherQAController.getStats);

export default router;
