import express from 'express';
import studentQAController from '../controllers/studentQAController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all questions for enrolled courses
router.get('/questions', studentQAController.getQuestions);

// Get single question with answers
router.get('/questions/:questionId', studentQAController.getQuestionById);

// Ask a new question
router.post('/questions', studentQAController.askQuestion);

// Answer a question
router.post('/questions/:questionId/answers', studentQAController.answerQuestion);

// Upvote question
router.post('/questions/:questionId/upvote', studentQAController.upvoteQuestion);

// Upvote answer
router.post('/answers/:answerId/upvote', studentQAController.upvoteAnswer);

export default router;
