// controllers/teacherController.js
import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
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
        const teacher = await Teacher.findById(req.user.id)
            .populate("institution");

        if (!teacher || !teacher.institution) {
            return res.json({ institution: null });
        }

        const institutionId = teacher.institution._id;

        const totalStudents = await Student.countDocuments({
            institution: institutionId,
        });

        const totalTeachers = await Teacher.countDocuments({
            institution: institutionId,
        });

        res.json({
            institution: {
                ...teacher.institution.toObject(),
                stats: {
                    totalStudents,
                    totalTeachers,
                },
            },
        });
    } catch (error) {
        console.error("Get Teacher Institution Error:", error);
        res.status(500).json({ message: "Failed to fetch institution" });
    }
};