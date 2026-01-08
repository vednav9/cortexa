import CortexaAdmin from "../models/cortexaAdmin.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";



/* =====================
   REGISTER (ONE TIME)
===================== */
export const registerCortexaAdmin = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        const exists = await CortexaAdmin.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const admin = await CortexaAdmin.create({
            fullName,
            email,
            password,
        });

        res.status(201).json({
            success: true,
            message: "Cortexa admin created",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

/* =====================
   LOGIN
===================== */
export const loginCortexaAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await CortexaAdmin.findOne({ email }).select("+password");
        if (!admin) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken({
            id: admin._id,
            role: admin.role,
        });

        res
            .cookie("token", token, cookieOptions)
            .status(200)
            .json({
                success: true,
                message: "Logged in",
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
