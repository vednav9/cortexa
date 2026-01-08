import Student from "../models/student.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import Institution from "../models/institution.js";

/* ===============================
   REGISTER STUDENT
================================ */
export const registerStudent = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: "Student already exists",
            });
        }

        const newStudent = await Student.create({
            fullName,
            email,
            password,
            role: "student",
        });

        const token = generateToken({
            id: newStudent._id,
            role: "student",
        });

        res.cookie("token", token, cookieOptions);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: newStudent._id,
                name: newStudent.fullName,
                email: newStudent.email,
                role: "student",
            },
        });
    } catch (error) {
        console.error("Register Student Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};

/* ===============================
   LOGIN STUDENT
================================ */
export const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const student = await Student.findOne({ email }).select("+password");
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = generateToken({
            id: student._id,
            role: "student",
        });

        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: student._id,
                name: student.fullName,
                email: student.email,
                role: "student",
            },
        });
    } catch (error) {
        console.error("Login Student Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

/* ===============================
   GET STUDENT PROFILE (ME)
================================ */
export const getUserProfile = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token found",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const student = await Student.findById(decoded.id).select(
            "fullName email role"
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: student._id,
                name: student.fullName,
                email: student.email,
                role: student.role,
            },
        });
    } catch (error) {
        console.error("Get Student Profile Error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

/* ===============================
   LOGOUT STUDENT
================================ */
export const logoutStudent = (req, res) => {
    try {
        res.clearCookie("token", cookieOptions);

        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            expires: new Date(0),
            path: "/",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout Student Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during logout",
        });
    }
};

/* ===============================
   GET MY INSTITUTION (STUDENT)
================================ */
export const getMyInstitution = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate("institution");

        if (!student || !student.institution) {
            return res.json({ institution: null });
        }

        res.json({
            institution: student.institution,
        });
    } catch (error) {
        console.error("Get My Institution Error:", error);
        res.status(500).json({
            message: "Failed to fetch institution",
        });
    }
};

/* ===============================
   LEAVE INSTITUTION (STUDENT)
================================ */
export const leaveInstitution = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);

        if (!student || !student.institution) {
            return res.status(400).json({
                message: "You are not part of any institution",
            });
        }

        const institutionId = student.institution;

        // Remove student from institution stats
        const institution = await Institution.findById(institutionId);
        if (institution) {
            institution.students.pull(req.user.id);
            institution.stats.totalStudents = Math.max(
                0,
                institution.stats.totalStudents - 1
            );
            await institution.save();
        }

        // Clear student institution
        student.institution = null;
        await student.save();

        res.json({
            message: "Left institution successfully",
        });
    } catch (error) {
        console.error("Leave Institution Error:", error);
        res.status(500).json({
            message: "Failed to leave institution",
        });
    }
};

