// controllers/teacherController.js
import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import Course from "../models/course.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";





/* =========================
   REGISTER TEACHER
========================= */
export const registerTeacher = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({
                success: false,
                message: "Teacher already exists",
            });
        }

        const teacher = await Teacher.create({
            fullName,
            email,
            password,
            role: "teacher",
        });

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
        });

        res.cookie("token", token, cookieOptions);

        res.status(201).json({
            success: true,
            user: {
                id: teacher._id,
                name: teacher.fullName,   // ✅ IMPORTANT
                email: teacher.email,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error("Register Teacher Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};

/* =========================
   LOGIN TEACHER
========================= */
export const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const teacher = await Teacher.findOne({ email }).select("+password");
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
        });

        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            success: true,
            user: {
                id: teacher._id,
                name: teacher.fullName,   // ✅ IMPORTANT
                email: teacher.email,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error("Login Teacher Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

/* =========================
   LOGOUT TEACHER
========================= */
export const logoutTeacher = (req, res) => {
    res.clearCookie("token", cookieOptions);
    res.status(200).json({
        success: true,
        message: "Teacher logged out successfully",
    });
};


export const getMyInstitution = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.user.id).populate("institution");

        if (!teacher || !teacher.institution) {
            return res.json({ institution: null });
        }

        const institutionId = teacher.institution._id;

        const [studentsCount, teachersCount] = await Promise.all([
            Student.countDocuments({ institution: institutionId }),
            Teacher.countDocuments({ institution: institutionId }),
        ]);

        res.json({
            institution: {
                ...teacher.institution.toObject(),
                role: "teacher",
                stats: {
                    students: studentsCount,
                    teachers: teachersCount,
                    courses: 0,
                },
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch institution" });
    }
};

/* =========================
   GET AUTHORIZED COURSES
========================= */
export const getAuthorizedCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;
        
        // Get teacher with populated authorized courses
        const teacher = await Teacher.findById(teacherId)
            .populate({
                path: "authorizedCourses",
                populate: [
                    { path: "department", select: "name code" },
                    { path: "semesterAvailable", select: "name academicYear" }
                ]
            });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        // Filter only active courses
        const activeCourses = teacher.authorizedCourses.filter(course => course.isActive);

        res.status(200).json({
            success: true,
            count: activeCourses.length,
            courses: activeCourses
        });
    } catch (error) {
        console.error("Get authorized courses error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch authorized courses"
        });
    }
};

/* =========================
   GET STUDENTS IN AUTHORIZED COURSES
========================= */
export const getStudentsInAuthorizedCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { courseId, departmentId, semesterId } = req.query;

        // Get teacher with authorized courses
        const teacher = await Teacher.findById(teacherId)
            .select('authorizedCourses institution department semester');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        // Build query for students
        let studentQuery = {
            institution: teacher.institution,
            status: 'active'
        };

        // If specific course is requested, check if teacher is authorized
        if (courseId) {
            const isAuthorized = teacher.authorizedCourses.some(
                course => course.toString() === courseId
            );
            
            if (!isAuthorized) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view students for this course"
                });
            }
            
            studentQuery.enrolledCourses = courseId;
        } else {
            // Show students enrolled in ANY of teacher's authorized courses
            if (teacher.authorizedCourses.length > 0) {
                studentQuery.enrolledCourses = { $in: teacher.authorizedCourses };
            }
        }

        // Add optional filters
        if (departmentId) {
            studentQuery.department = departmentId;
        }
        if (semesterId) {
            studentQuery.semester = semesterId;
        }

        // Fetch students with populated fields
        const students = await Student.find(studentQuery)
            .populate('department', 'name code')
            .populate('semester', 'name academicYear')
            .populate('enrolledCourses', 'name code')
            .select('fullName email phone username enrolledCourses department semester status')
            .sort({ fullName: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get students error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};
