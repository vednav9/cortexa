import Student from "../models/student.js";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

//student register
export const registerStudent = async (req, res) => {
    try {
        // ... existing validation code ...

        const newStudent = await Student.create({
            fullName,
            email,
            password,
            role,
        });

        const token = generateToken(newStudent._id);

        // ✅ Set token in httpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: newStudent._id,
                fullName: newStudent.fullName,
                email: newStudent.email,
                role: newStudent.role,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// loginStudent controller - Updated
export const loginStudent = async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        if (!email || !password || !userType) {
            return res.status(400).json({ message: "Email, password and role are required" });
        }

        const student = await Student.findOne({ email, role: userType }).select("+password");

        if (!student) {
            return res.status(400).json({ message: "Invalid email, password or role" });
        }

        const isMatch = await student.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email, password or role" });
        }

        // Generate token
        const token = jwt.sign(
            { id: student._id, role: student.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ Set token in httpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,        // Prevents JavaScript access (XSS protection)
            secure: process.env.NODE_ENV === "production",  // HTTPS only in production
            sameSite: "strict",    // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: student._id,
                fullName: student.fullName,
                email: student.email,
                role: student.role,
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get user info from cookie token
export const getUserProfile = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No token found" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const student = await Student.findById(decoded.id).select("fullName email role");

        if (!student) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: {
                name: student.fullName,
                email: student.email,
                role: student.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};




