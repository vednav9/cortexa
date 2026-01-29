import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getQAsByCourse,
  getQAsByInstitution,
  getQAStats,
  getQAById,
  createQA,
  addAnswer,
  updateQAStatus,
  acceptAnswer,
  upvoteQA,
  upvoteAnswer,
  deleteQA,
  getUserQAs
} from '../controllers/qaController.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/course/:courseId', authenticate, getQAsByCourse);
router.get('/institution/:institutionId', authenticate, getQAsByInstitution);
router.get('/course/:courseId/stats', authenticate, getQAStats);
router.get('/institution/:institutionId/stats', authenticate, getQAStats);
router.get('/my-questions', authenticate, getUserQAs);
router.get('/:qaId', authenticate, getQAById);

// Create Q&A
router.post('/course/:courseId', authenticate, createQA);

// Answer operations
router.post('/:qaId/answer', authenticate, addAnswer);
router.patch('/:qaId/answer/:answerId/accept', authenticate, acceptAnswer);
router.post('/:qaId/answer/:answerId/upvote', authenticate, upvoteAnswer);

// Q&A operations
router.patch('/:qaId/status', authenticate, updateQAStatus);
router.post('/:qaId/upvote', authenticate, upvoteQA);
router.delete('/:qaId', authenticate, deleteQA);

export default router;
