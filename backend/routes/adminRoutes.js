import express from "express";
import {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getAdminProfile,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import fs from "fs";

const router = express.Router();

router.post("/register", upload.single("logo"), registerAdmin);

router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/me", authenticate, getAdminProfile);

// Get all students
router.get("/students", authenticate, async (req, res) => {
  try {
    const students = await Student.find()
      .select('fullName email createdAt')
      .sort('-createdAt');
    
    const formattedStudents = students.map(s => ({
      id: s._id,
      name: s.fullName,
      email: s.email,
      logo: s.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      role: 'Student',
      status: 'active',
      createdAt: s.createdAt
    }));
    
    res.json({ students: formattedStudents });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Get all teachers
router.get("/teachers", authenticate, async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select('fullName email createdAt')
      .sort('-createdAt');
    
    const formattedTeachers = teachers.map(t => ({
      id: t._id,
      name: t.fullName,
      email: t.email,
      logo: t.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      role: 'Teacher',
      status: 'active',
      createdAt: t.createdAt
    }));
    
    res.json({ teachers: formattedTeachers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
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

