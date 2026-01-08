import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Admin from "../models/admin.js";
import CortexaAdmin from "../models/cortexaAdmin.js";


export const getMe = async (req, res) => {
    try {
        const { id, role } = req.user;
        let user = null;

        if (role === "student") {
            user = await Student.findById(id)
                .populate("institution")
                .select("fullName email role institution");
        } else if (role === "teacher") {
            user = await Teacher.findById(id)
                .populate("institution")
                .select("fullName email role institution");
        } else if (role === "admin") {
            user = await Admin.findById(id)
                .populate("institution")
                .select("fullName email role institution");
        }
        else if (role === "cortexa_admin") {
            user = await CortexaAdmin.findById(id).select("fullName email role");
        }
        else {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.role,
                institution: user.institution || null, // Include for all roles
            },
        });

    } catch (err) {
        console.error("GET /me error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
