import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Institution from '../models/institution.js';
import Membership from '../models/membership.js';
import Invitation from '../models/invitation.js';
import Admin from '../models/admin.js';

const router = express.Router();

// Get all institutions (public browse)
router.get('/browse', async (req, res) => {
  try {
    const institutions = await Institution.find()
      .select('name slug code type description address contact branding stats departments established')
      .sort('name');
    
    res.json({ 
      success: true,
      count: institutions.length,
      institutions 
    });
  } catch (error) {
    console.error('❌ Error fetching institutions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching institutions', 
      error: error.message 
    });
  }
});

// Get institution by slug (PUBLIC - for institution pages)
// Support both /slug/:slug and /:slug for flexibility
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Try to find institution by slug
    let institution = await Institution.findOne({ slug })
      .select('name slug code type description address contact branding stats departments established');
    
    // If not found by slug, try by code (case-insensitive)
    if (!institution) {
      institution = await Institution.findOne({ 
        code: new RegExp(`^${slug}$`, 'i') 
      }).select('name slug code type description address contact branding stats departments established');
    }
    
    if (!institution) {
      return res.status(404).json({ 
        success: false,
        message: 'Institution not found' 
      });
    }
    
    res.json({ 
      success: true,
      institution 
    });
  } catch (error) {
    console.error('❌ Error fetching institution by slug:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching institution', 
      error: error.message 
    });
  }
});

// LEGACY: Get institution by slug (PUBLIC - for institution pages)
router.get('/slug/:slug', async (req, res) => {
  try {
    // Mock data mapping for now
    const slugToData = {
      'mumbai-university': {
        slug: 'mumbai-university',
        name: 'University of Mumbai',
        shortName: 'MU',
        type: 'University',
        description: 'One of the oldest and premier universities in India',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/University_of_Mumbai_coat_of_arms.svg/150px-University_of_Mumbai_coat_of_arms.svg.png',
        branding: {
          primaryColor: '#0052A5',
          accentColor: '#003366'
        },
        stats: {
          totalStudents: 45000,
          totalFaculty: 850,
          totalCourses: 320,
          activeSemesters: 2
        },
        departments: [
          { id: 1, name: 'Computer Science', code: 'CS' },
          { id: 2, name: 'Information Technology', code: 'IT' }
        ]
      }
    };

    const institution = slugToData[req.params.slug];
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    
    res.json({ institution });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching institution', error: error.message });
  }
});

// Get courses for institution (PUBLIC)
router.get('/slug/:slug/courses', async (req, res) => {
  try {
    // Mock courses data
    const courses = [
      {
        id: 1,
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Fundamental concepts of computer science and programming',
        credits: 3,
        instructor: 'Dr. Rajesh Sharma',
        duration: '14 weeks',
        rating: 4.5,
        department: 'CS'
      },
      {
        id: 2,
        code: 'CS201',
        name: 'Data Structures and Algorithms',
        description: 'Advanced data structures and algorithmic techniques',
        credits: 4,
        instructor: 'Dr. Priya Deshmukh',
        duration: '14 weeks',
        rating: 4.7,
        department: 'CS'
      }
    ];
    
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Get course details (PUBLIC)
router.get('/slug/:slug/courses/:courseCode', async (req, res) => {
  try {
    // Mock course detail
    const course = {
      id: 1,
      code: req.params.courseCode,
      name: 'Introduction to Computer Science',
      description: 'Fundamental concepts of computer science and programming',
      fullDescription: 'This comprehensive course introduces students to the foundational concepts of computer science, including programming fundamentals, computational thinking, and problem-solving strategies.',
      credits: 3,
      instructor: 'Dr. Rajesh Sharma',
      duration: '14 weeks',
      schedule: 'Mon, Wed, Fri - 10:00 AM',
      rating: 4.5,
      department: 'Computer Science',
      outcomes: [
        'Understand fundamental programming concepts',
        'Apply computational thinking to solve problems',
        'Design and implement basic algorithms',
        'Write clean and efficient code'
      ],
      topics: [
        'Programming Basics',
        'Data Types & Variables',
        'Control Structures',
        'Functions & Modules',
        'Object-Oriented Programming',
        'Algorithm Design'
      ]
    };
    
    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
});

// Get institution by ID (AUTHENTICATED)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id)
      .populate('admin', 'fullName email')
      .populate('students', 'fullName email')
      .populate('teachers', 'fullName email');
    
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

// Admin route: Update institution details
router.put('/update', authenticate, async (req, res) => {
  try {
    const adminId = req.user.userId;
    const updateData = req.body;

    // Get admin to verify institution
    const admin = await Admin.findById(adminId).populate('institution');
    
    if (!admin || !admin.institution) {
      return res.status(404).json({
        success: false,
        message: "Admin or institution not found"
      });
    }

    // Check if admin has edit permission
    if (!admin.isSuperAdmin && !admin.permissions.canEditInstitution) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit institution details"
      });
    }

    const institution = await Institution.findByIdAndUpdate(
      admin.institution._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-admins -superAdmin');

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found"
      });
    }

    res.json({
      success: true,
      message: "Institution updated successfully",
      institution
    });
  } catch (error) {
    console.error("❌ Error updating institution:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update institution",
      error: error.message
    });
  }
});

export default router;
