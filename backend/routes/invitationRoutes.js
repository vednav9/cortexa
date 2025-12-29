import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Invitation from '../models/invitation.js';
import Institution from '../models/institution.js';
import Membership from '../models/membership.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';

const router = express.Router();

// Get user's invitations
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {
      recipient: req.user.userId,
      recipientType: req.user.role === 'student' ? 'Student' : 'Teacher'
    };
    
    if (status) {
      query.status = status;
    }
    
    const invitations = await Invitation.find(query)
      .populate('institution', 'name code logo description')
      .populate('sender', 'name email')
      .sort('-createdAt');
    
    res.json({ invitations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invitations', error: error.message });
  }
});

// Create invitation (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { institutionId, recipientId, recipientType, type, message } = req.body;
    
    // Verify institution belongs to admin
    const institution = await Institution.findOne({
      _id: institutionId,
      admin: req.user.userId
    });
    
    if (!institution) {
      return res.status(403).json({ message: 'Not authorized to send invitations for this institution' });
    }
    
    // Check if invitation already exists
    const existing = await Invitation.findOne({
      institution: institutionId,
      recipient: recipientId,
      status: 'pending'
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Invitation already sent' });
    }
    
    const invitation = new Invitation({
      institution: institutionId,
      recipient: recipientId,
      recipientType,
      sender: req.user.userId,
      type,
      message
    });
    
    await invitation.save();
    
    await invitation.populate(['institution', 'sender']);
    
    res.status(201).json({ 
      message: 'Invitation sent successfully', 
      invitation 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating invitation', error: error.message });
  }
});

// Accept invitation
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Verify invitation belongs to user
    if (invitation.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }
    
    // Check if already a member
    const existingMembership = await Membership.findOne({
      user: req.user.userId,
      institution: invitation.institution
    });
    
    if (existingMembership) {
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await invitation.save();
      return res.status(400).json({ message: 'Already a member' });
    }

    // Update user-specific fields from request body
    if (invitation.recipientType === 'Student') {
      const { class: className, division, enrollmentNumber } = req.body;
      
      // Update student with class, division, enrollmentNumber
      await Student.findByIdAndUpdate(req.user.userId, {
        class: className,
        division,
        enrollmentNumber
      });
    } else if (invitation.recipientType === 'Teacher') {
      const { department, specialization } = req.body;
      
      // Update teacher with department, specialization
      await Teacher.findByIdAndUpdate(req.user.userId, {
        department,
        specialization
      });
    }
    
    // Create membership
    const membership = new Membership({
      user: req.user.userId,
      userType: invitation.recipientType,
      institution: invitation.institution,
      role: invitation.recipientType.toLowerCase()
    });
    
    await membership.save();
    
    // Update institution
    const institution = await Institution.findById(invitation.institution);
    if (institution) {
      if (invitation.recipientType === 'Student') {
        institution.students.push(req.user.userId);
        institution.stats.totalStudents += 1;
      } else {
        institution.teachers.push(req.user.userId);
        institution.stats.totalTeachers += 1;
      }
      await institution.save();
    }
    
    // Update invitation
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();
    
    res.json({ 
      message: 'Invitation accepted successfully', 
      membership 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
});

// Reject invitation
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Verify invitation belongs to user
    if (invitation.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }
    
    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    await invitation.save();
    
    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting invitation', error: error.message });
  }
});

// Delete invitation (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id).populate('institution');
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if user is admin of the institution
    if (invitation.institution.admin.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await invitation.deleteOne();
    
    res.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invitation', error: error.message });
  }
});

export default router;
