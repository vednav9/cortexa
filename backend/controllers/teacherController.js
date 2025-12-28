import jwt from "jsonwebtoken";
import Teacher from "../models/teacher.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";


export const registerTeacher = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ success: false, message: "Teacher already exists" });
        }

        const newTeacher = await Teacher.create({
            fullName,
            email,
            password,
            role: role || "teacher",
        });

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
        });

        res.cookie("token", token, cookieOptions);


        res.status(201).json({
            success: true,
            message: "Teacher registered successfully",
            user: {
                id: newTeacher._id,
                fullName: newTeacher.fullName,
                email: newTeacher.email,
                role: newTeacher.role,
            },
        });
    } catch (error) {
        console.error("Register Teacher Error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
};

export const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Must select password explicitly
        const teacher = await Teacher.findOne({ email }).select("+password");
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
        });

        res.cookie("token", token, cookieOptions);


        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                name: teacher.fullName,
                email: teacher.email,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error("Login Teacher Error:", error);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
};

// ✅ LOGOUT TEACHER
export const logoutTeacher = async (req, res) => {
    try {
        res.clearCookie("token", cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Teacher logged out successfully.",
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to log out teacher.",
        });
    }
};


export const getTeacherProfile = async (req, res) => {
    try {
        // The req.user comes from your authenticate middleware (decoded JWT)
        const teacherId = req.user.id;

        const teacher = await Teacher.findById(teacherId).select("-password");
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        res.status(200).json({
            success: true,
            user: teacher
        });
    } catch (error) {
        console.error("Error fetching teacher profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching teacher profile"
        });
    }
};