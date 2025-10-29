import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";

// Register new institution admin
export const registerAdmin = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            jobTitle,
            phone,
            authorized,
            institutionName,
            institutionType,
            website,
            address1,
            city,
            state,
            country,
            postalCode,
            description,
            customURL,
            brandColor,
        } = req.body;

        // Check existing admin
        const existing = await Admin.findOne({ email });
        if (existing)
            return res.status(400).json({ message: "Admin already exists with this email." });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle logo upload (optional)
        let logo = "";
        if (req.file) {
            logo = `/uploads/${req.file.filename}`; // or use Cloudinary URL
        }

        const newAdmin = new Admin({
            fullName,
            email,
            password: hashedPassword,
            jobTitle,
            phone,
            authorized,
            institutionName,
            institutionType,
            website,
            address1,
            city,
            state,
            country,
            postalCode,
            description,
            logo,
            customURL,
            brandColor,
        });

        await newAdmin.save();

        res.status(201).json({
            message: "Institution registered successfully!",
            admin: {
                id: newAdmin._id,
                email: newAdmin.email,
                institutionName: newAdmin.institutionName,
            },
        });
    } catch (error) {
        console.error("Admin Registration Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Login admin
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                institutionName: admin.institutionName,
            },
        });
    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// 🔹 Logout Admin
export const logoutAdmin = (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        });

        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            expires: new Date(0),
            path: "/",
        });

        res.status(200).json({
            success: true,
            message: "Admin logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ success: false, message: "Error during logout" });
    }
};

// 🔹 Get Admin Profile
export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select("-password");

        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        res.status(200).json({
            success: true,
            user: admin,
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ success: false, message: "Error fetching profile" });
    }
};
