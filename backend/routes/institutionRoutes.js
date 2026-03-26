import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Institution from '../models/institution.js';
import Membership from '../models/membership.js';
import Invitation from '../models/invitation.js';
import Admin from '../models/admin.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import Course from '../models/course.js';
import Department from '../models/department.js';
import Semester from '../models/semester.js';
import Document from '../models/document.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return req.cookies?.token || bearer || null;
};

const getOptionalRequestUser = (req) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {
    return null;
  }
};

const resolveCourseAccessIds = async ({ user, institutionId }) => {
  const userId = user?.id || user?._id || user?.userId;
  if (!userId || !user?.role) return null;

  if (user.role === 'admin') {
    const admin = await Admin.findById(userId).select('institution');
    if (!admin?.institution || admin.institution.toString() !== institutionId.toString()) {
      return [];
    }
    return null;
  }

  if (user.role === 'teacher') {
    const teacher = await Teacher.findById(userId).select('institution authorizedCourses');
    if (!teacher?.institution || teacher.institution.toString() !== institutionId.toString()) {
      return [];
    }
    return (teacher.authorizedCourses || []).map((id) => id.toString());
  }

  if (user.role === 'student') {
    const student = await Student.findById(userId).select('institution enrolledCourses');
    if (!student?.institution || student.institution.toString() !== institutionId.toString()) {
      return [];
    }
    return (student.enrolledCourses || []).map((id) => id.toString());
  }

  return [];
};

// ============================================
// PUBLIC ROUTES (More specific routes FIRST)
// ============================================

// Get all institutions (public browse)
router.get('/browse', async (req, res) => {
  try {
    const institutions = await Institution.find()
      .select('name slug code type description address contact branding departments established')
      .sort('name');

    // Calculate stats for each institution
    const institutionsWithStats = await Promise.all(institutions.map(async (institution) => {
      const [totalStudents, totalFaculty, totalCourses, activeSemesters, totalDepartments] = await Promise.all([
        Student.countDocuments({ institution: institution._id, status: 'active' }),
        Teacher.countDocuments({ institution: institution._id, status: 'active' }),
        Course.countDocuments({ institution: institution._id, isActive: true }),
        Semester.countDocuments({ institution: institution._id, isActive: true }),
        Department.countDocuments({ institution: institution._id })
      ]);

      const institutionObj = institution.toObject();
      institutionObj.stats = {
        totalStudents,
        totalFaculty,
        totalCourses,
        activeSemesters,
        totalDepartments
      };

      return institutionObj;
    }));

    res.json({
      success: true,
      count: institutionsWithStats.length,
      institutions: institutionsWithStats
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

// Get institution by slug (PUBLIC) - MUST BE BEFORE /:slug route
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Try to find institution by slug
    let institution = await Institution.findOne({ slug })
      .select('name slug code type description address contact branding departments established');

    // If not found by slug, try by code (case-insensitive)
    if (!institution) {
      institution = await Institution.findOne({
        code: new RegExp(`^${slug}$`, 'i')
      }).select('name slug code type description address contact branding departments established');
    }

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Calculate real-time stats
    const [totalStudents, totalFaculty, totalCourses, activeSemesters, totalDepartments] = await Promise.all([
      Student.countDocuments({ institution: institution._id, status: 'active' }),
      Teacher.countDocuments({ institution: institution._id, status: 'active' }),
      Course.countDocuments({ institution: institution._id, isActive: true }),
      Semester.countDocuments({ institution: institution._id, isActive: true }),
      Department.countDocuments({ institution: institution._id })
    ]);

    // Convert to plain object and add stats
    institution = institution.toObject();
    institution.stats = {
      totalStudents,
      totalFaculty,
      totalCourses,
      activeSemesters,
      totalDepartments
    };

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

// Get courses for institution (PUBLIC + role-aware when authenticated)
router.get('/slug/:slug/courses', async (req, res) => {
  try {
    const { slug } = req.params;
    let institution = await Institution.findOne({ slug }).select('_id code slug');

    if (!institution) {
      institution = await Institution.findOne({
        code: new RegExp(`^${slug}$`, 'i')
      }).select('_id code slug');
    }

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    const decoded = getOptionalRequestUser(req);
    const allowedCourseIds = await resolveCourseAccessIds({
      user: decoded,
      institutionId: institution._id
    });

    const query = { institution: institution._id, isActive: true };
    if (Array.isArray(allowedCourseIds)) {
      query._id = { $in: allowedCourseIds };
    }

    const courses = await Course.find(query)
      .populate('department', 'name code')
      .populate('instructor', 'fullName')
      .sort({ code: 1, name: 1 });

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((course) => ({
        id: course._id,
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        instructor: course.instructor?.fullName || '',
        department: course.department?.code || course.department?.name || '',
        semester: course.semester,
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching courses', error: error.message });
  }
});

// Get course details (PUBLIC + role-aware when authenticated)
router.get('/slug/:slug/courses/:courseCode', async (req, res) => {
  try {
    const { slug, courseCode } = req.params;

    let institution = await Institution.findOne({ slug }).select('_id code slug');
    if (!institution) {
      institution = await Institution.findOne({
        code: new RegExp(`^${slug}$`, 'i')
      }).select('_id code slug');
    }

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const decoded = getOptionalRequestUser(req);
    const allowedCourseIds = await resolveCourseAccessIds({
      user: decoded,
      institutionId: institution._id
    });

    const courseQuery = {
      institution: institution._id,
      code: String(courseCode || '').toUpperCase(),
      isActive: true
    };

    if (Array.isArray(allowedCourseIds)) {
      courseQuery._id = { $in: allowedCourseIds };
    }

    const course = await Course.findOne(courseQuery)
      .populate('department', 'name code')
      .populate('instructor', 'fullName');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const documents = await Document.find({
      institution: institution._id,
      course: course._id
    })
      .populate('uploadedBy', 'fullName')
      .sort({ createdAt: -1 })
      .select('originalName fileType fileSize isProcessed chunksCount downloadCount createdAt fileUrl uploadedBy');

    res.json({
      success: true,
      course: {
        id: course._id,
        code: course.code,
        name: course.name,
        description: course.description,
        fullDescription: course.syllabus || course.description,
        credits: course.credits,
        instructor: course.instructor?.fullName || '',
        department: course.department?.name || course.department?.code || '',
        semester: course.semester,
      },
      documents: documents.map((doc) => ({
        _id: doc._id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        isProcessed: doc.isProcessed,
        chunksCount: doc.chunksCount,
        downloadCount: doc.downloadCount || 0,
        createdAt: doc.createdAt,
        uploadedBy: doc.uploadedBy?.fullName || 'Unknown',
        fileUrl: doc.fileUrl,
        downloadUrl: `/institutions/slug/${institution.slug || institution.code}/documents/${doc._id}/download`
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching course', error: error.message });
  }
});

// Download a course document with access check + tracked download count
router.get('/slug/:slug/documents/:documentId/download', async (req, res) => {
  try {
    const { slug, documentId } = req.params;
    const decoded = getOptionalRequestUser(req);

    if (!decoded?.role) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (decoded.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can download course documents' });
    }

    let institution = await Institution.findOne({ slug }).select('_id code slug');
    if (!institution) {
      institution = await Institution.findOne({
        code: new RegExp(`^${slug}$`, 'i')
      }).select('_id code slug');
    }

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const document = await Document.findOne({
      _id: documentId,
      institution: institution._id
    }).select('fileUrl course');

    if (!document?.fileUrl) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const allowedCourseIds = await resolveCourseAccessIds({
      user: decoded,
      institutionId: institution._id
    });

    if (Array.isArray(allowedCourseIds) && !allowedCourseIds.includes(document.course.toString())) {
      return res.status(403).json({ success: false, message: 'You are not authorized to download this document' });
    }

    await Document.updateOne({ _id: document._id }, { $inc: { downloadCount: 1 } });
    return res.redirect(document.fileUrl);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to download document', error: error.message });
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Get institution by ID (AUTHENTICATED) - This stays after /slug routes
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

export default router;
