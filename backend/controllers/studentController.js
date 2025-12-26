import Student from "../models/student.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

//student register
export const registerStudent = async (req, res) => {
    try {
        // ... existing validation code ...
        const { fullName, email, password, role } = req.body;


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
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        // ✅ Compare hashed password
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: student._id, role: student.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ Set cookie properly
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
                fullName: student.fullName,
                email: student.email,
                role: student.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error during login" });
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
                fullName: student.fullName,
                email: student.email,
                role: student.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

//logout student
export const logoutStudent = (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/", // must match login
        });

        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            expires: new Date(0),
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully and cookie cleared",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during logout",
        });
    }
};






