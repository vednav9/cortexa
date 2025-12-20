import Student from "../models/student.js";
import Teacher from "../models/teacher.js";

export const getMe = async (req, res) => {
    try {
        const { id, role } = req.user;

        let user;

        if (role === "student") {
            user = await Student.findById(id).select("fullName email role");
        }
        else if (role === "teacher") {
            user = await Teacher.findById(id).select("fullName email role");
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
                name: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Auth Me Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
