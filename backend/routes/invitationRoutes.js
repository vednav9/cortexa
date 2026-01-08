import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getInvitations,
  createInvitation,
  acceptInvitation,
  rejectInvitation,
  deleteInvitation,
  getAdminInvitations,
  bulkInviteUsers
} from '../controllers/invitationController.js';

const router = express.Router();

// Student / Teacher
router.get('/', authenticate, getInvitations);
router.post('/', authenticate, createInvitation);
router.post('/:id/accept', authenticate, acceptInvitation);
router.post('/:id/reject', authenticate, rejectInvitation);

// Admin
router.get('/admin', authenticate, getAdminInvitations);
router.delete('/:id', authenticate, deleteInvitation);
router.post('/bulk', authenticate, bulkInviteUsers);

export default router;
