import express from "express";
import {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getAdminProfile,
    addAdminToInstitution,
    getAllInstitutionAdmins,
    updateAdminPermissions,
    removeAdmin,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Invitation from "../models/invitation.js";
import Membership from "../models/membership.js";
import Admin from "../models/admin.js";
import fs from "fs";

const router = express.Router();

// Auth routes
router.post("/register", upload.single("logo"), registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
// router.get("/me", authenticate, getAdminProfile);

// Admin management routes (Super Admin only)
router.post("/add-admin", authenticate, addAdminToInstitution);
router.get("/admins", authenticate, getAllInstitutionAdmins);
router.put("/admins/:adminId/permissions", authenticate, updateAdminPermissions);
router.delete("/admins/:adminId", authenticate, removeAdmin);

// Get all students (only those who accepted invitation for this institution)
router.get("/students", authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId).populate('institution');
    
    if (!admin || !admin.institution) {
      return res.status(404).json({ message: 'Admin or institution not found' });
    }

    // Get all accepted invitations for this institution
    const acceptedInvitations = await Invitation.find({
      institution: admin.institution._id,
      recipientType: 'Student',
      status: 'accepted'
    }).select('recipient');

    const acceptedStudentIds = acceptedInvitations.map(inv => inv.recipient);

    // Get students who have accepted invitations
    const students = await Student.find({
      _id: { $in: acceptedStudentIds }
    }).select('fullName email class division enrollmentNumber createdAt');
    
    const formattedStudents = students.map(s => ({
      id: s._id,
      name: s.fullName,
      email: s.email,
      class: s.class || 'N/A',
      division: s.division || 'N/A',
      enrollmentNumber: s.enrollmentNumber || 'N/A',
      logo: s.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      role: 'Student',
      status: 'active',
      createdAt: s.createdAt
    }));
    
    res.json({ 
      success: true,
      count: formattedStudents.length,
      students: formattedStudents 
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Get all teachers (only those who accepted invitation for this institution)
router.get("/teachers", authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId).populate('institution');
    
    if (!admin || !admin.institution) {
      return res.status(404).json({ message: 'Admin or institution not found' });
    }

    // Get all accepted invitations for this institution
    const acceptedInvitations = await Invitation.find({
      institution: admin.institution._id,
      recipientType: 'Teacher',
      status: 'accepted'
    }).select('recipient');

    const acceptedTeacherIds = acceptedInvitations.map(inv => inv.recipient);

    // Get teachers who have accepted invitations
    const teachers = await Teacher.find({
      _id: { $in: acceptedTeacherIds }
    }).select('fullName email department specialization createdAt');
    
    const formattedTeachers = teachers.map(t => ({
      id: t._id,
      name: t.fullName,
      email: t.email,
      department: t.department || 'N/A',
      specialization: t.specialization || 'N/A',
      logo: t.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      role: 'Teacher',
      status: 'active',
      createdAt: t.createdAt
    }));
    
    res.json({ 
      success: true,
      count: formattedTeachers.length,
      teachers: formattedTeachers 
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
});

// Get pending invitation requests
router.get("/pending-requests", authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId).populate('institution');
    
    if (!admin || !admin.institution) {
      return res.status(404).json({ message: 'Admin or institution not found' });
    }

    // Get all pending invitations for this institution
    const pendingInvitations = await Invitation.find({
      institution: admin.institution._id,
      status: 'pending'
    })
    .populate('recipient', 'fullName email class division enrollmentNumber department specialization')
    .populate('sender', 'fullName')
    .sort('-createdAt');

    const formattedRequests = pendingInvitations.map(inv => ({
      id: inv._id,
      recipientId: inv.recipient._id,
      name: inv.recipient.fullName,
      email: inv.recipient.email,
      type: inv.recipientType, // 'Student' or 'Teacher'
      // Student-specific fields
      class: inv.recipientType === 'Student' ? (inv.recipient.class || 'N/A') : undefined,
      division: inv.recipientType === 'Student' ? (inv.recipient.division || 'N/A') : undefined,
      enrollmentNumber: inv.recipientType === 'Student' ? (inv.recipient.enrollmentNumber || 'N/A') : undefined,
      // Teacher-specific fields
      department: inv.recipientType === 'Teacher' ? (inv.recipient.department || 'N/A') : undefined,
      specialization: inv.recipientType === 'Teacher' ? (inv.recipient.specialization || 'N/A') : undefined,
      logo: inv.recipient.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      sentBy: inv.sender ? inv.sender.fullName : 'N/A',
      sentAt: inv.createdAt,
      expiresAt: inv.expiresAt
    }));
    
    res.json({ 
      success: true,
      count: formattedRequests.length,
      pendingRequests: formattedRequests 
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Error fetching pending requests', error: error.message });
  }
});

// Delete student
router.delete("/students/:id", authenticate, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

// Delete teacher
router.delete("/teachers/:id", authenticate, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
});

// Bulk upload users from CSV
router.post("/bulk-upload", authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { userType } = req.body;
    if (!userType || !['student', 'teacher'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Read CSV from disk
    const csvData = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const users = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const userData = {
        fullName: values[0] || '',
        email: values[1] || '',
        password: values[2] || 'DefaultPassword123', // Default password or generate random
        mobile: values[3] || '',
        year: values[4] || '',
        dept: values[5] || '',
        division: values[6] || '',
      };

      try {
        const Model = userType === 'student' ? Student : Teacher;
        
        // Check if user already exists
        const existing = await Model.findOne({ email: userData.email });
        if (existing) {
          errors.push({ line: i + 1, email: userData.email, error: 'User already exists' });
          continue;
        }

        const user = new Model(userData);
        await user.save();
        users.push({ email: userData.email, name: userData.fullName });
      } catch (err) {
        errors.push({ line: i + 1, email: userData.email, error: err.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Bulk upload completed`,
      success: users.length,
      failed: errors.length,
      users,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing bulk upload', error: error.message });
  }
});

export default router;

