import jwt from "jsonwebtoken";
import Teacher from "../models/teacherModel.js";
import bcrypt from "bcryptjs";

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

        const token = jwt.sign(
            { id: newTeacher._id, role: newTeacher.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

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

        const token = jwt.sign(
            { id: teacher._id, role: teacher.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

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
