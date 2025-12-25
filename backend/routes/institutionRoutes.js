import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Institution from '../models/institution.js';
import Membership from '../models/membership.js';
import Invitation from '../models/invitation.js';

const router = express.Router();

// Get all institutions (public browse)
router.get('/browse', authenticate, async (req, res) => {
  try {
    const institutions = await Institution.find({ isActive: true })
      .select('name code logo description type stats')
      .sort('-stats.totalStudents');
    
    res.json({ institutions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching institutions', error: error.message });
  }
});

// Get institution by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('students', 'name email')
      .populate('teachers', 'name email');
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    
    res.json({ institution });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching institution', error: error.message });
  }
});

// Create institution (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, description, type, address, contact, settings } = req.body;
    
    // Check if code already exists
    const existing = await Institution.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: 'Institution code already exists' });
    }
    
    const institution = new Institution({
      name,
      code,
      description,
      type,
      address,
      contact,
      settings,
      admin: req.user.userId
    });
    
    await institution.save();
    
    res.status(201).json({ 
      message: 'Institution created successfully', 
      institution 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating institution', error: error.message });
  }
});

// Update institution (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    
    // Check if user is admin of this institution
    if (institution.admin.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const allowedUpdates = ['name', 'description', 'logo', 'address', 'contact', 'settings'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    Object.assign(institution, updates);
    await institution.save();
    
    res.json({ message: 'Institution updated successfully', institution });
  } catch (error) {
    res.status(500).json({ message: 'Error updating institution', error: error.message });
  }
});

// Delete institution (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    
    // Check if user is admin of this institution
    if (institution.admin.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Soft delete
    institution.isActive = false;
    await institution.save();
    
    res.json({ message: 'Institution deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting institution', error: error.message });
  }
});

// Join institution (for students/teachers)
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    
    // Check if already a member
    const existingMembership = await Membership.findOne({
      user: req.user.userId,
      institution: req.params.id
    });
    
    if (existingMembership) {
      return res.status(400).json({ message: 'Already a member' });
    }
    
    const membership = new Membership({
      user: req.user.userId,
      userType: req.user.role === 'student' ? 'Student' : 'Teacher',
      institution: req.params.id,
      role: req.user.role
    });
    
    await membership.save();
    
    // Update institution
    if (req.user.role === 'student') {
      institution.students.push(req.user.userId);
      institution.stats.totalStudents += 1;
    } else {
      institution.teachers.push(req.user.userId);
      institution.stats.totalTeachers += 1;
    }
    
    await institution.save();
    
    res.json({ message: 'Joined institution successfully', membership });
  } catch (error) {
    res.status(500).json({ message: 'Error joining institution', error: error.message });
  }
});

// Leave institution
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const membership = await Membership.findOneAndDelete({
      user: req.user.userId,
      institution: req.params.id
    });
    
    if (!membership) {
      return res.status(404).json({ message: 'Not a member' });
    }
    
    // Update institution
    const institution = await Institution.findById(req.params.id);
    if (institution) {
      if (req.user.role === 'student') {
        institution.students.pull(req.user.userId);
        institution.stats.totalStudents = Math.max(0, institution.stats.totalStudents - 1);
      } else {
        institution.teachers.pull(req.user.userId);
        institution.stats.totalTeachers = Math.max(0, institution.stats.totalTeachers - 1);
      }
      await institution.save();
    }
    
    res.json({ message: 'Left institution successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving institution', error: error.message });
  }
});

export default router;
