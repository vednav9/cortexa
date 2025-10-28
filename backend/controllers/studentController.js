import Student from "../models/student.js";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register Student
export const registerStudent = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, role } = req.body;

        // ✅ Basic validation
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Create student (no confirmPassword in DB)
        const newStudent = await Student.create({
            fullName,
            email,
            password,
            role,
        });

        // Generate JWT token
        const token = generateToken(newStudent._id);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: newStudent._id,
                fullName: newStudent.fullName,
                email: newStudent.email,
                role: newStudent.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//login student
export const loginStudent = async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        // ✅ Validate input
        if (!email || !password || !userType) {
            return res.status(400).json({ message: "Email, password and role are required" });
        }

        // ✅ Find user
        const student = await Student.findOne({ email, role: userType }).select("+password");

        // ⚠️ Must check before accessing student.password
        if (!student) {
            console.log("No student found for given email/role");
            return res.status(400).json({ message: "Invalid email, password or role" });
        }

        // ✅ Compare password
        // console.log("Found student:", student);
        // console.log("Entered Password:", password);
        // console.log("Stored Hashed Password:", student.password);

        const isMatch = await student.comparePassword(password);
        // console.log("Password Match:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email, password or role" });
        }

        // ✅ Generate token
        const token = jwt.sign(
            { id: student._id, role: student.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            // token,
            // user: {
            //     id: student._id,
            //     fullName: student.fullName,
            //     email: student.email,
            //     role: student.role,
            // },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


