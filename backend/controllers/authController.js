import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Admin from "../models/admin.js";
import Institution from "../models/institution.js";

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
        else if (role === "admin") {
            user = await Admin.findById(id)
                .select("fullName email role jobTitle isSuperAdmin permissions")
                .populate('institution', 'name slug code branding stats');
            
            if (user && user.institution) {
                user = {
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    jobTitle: user.jobTitle,
                    isSuperAdmin: user.isSuperAdmin,
                    permissions: user.permissions,
                    institution: {
                        name: user.institution.name,
                        slug: user.institution.slug,
                        code: user.institution.code,
                        logo: user.institution.branding?.logo,
                        stats: user.institution.stats
                    }
                };
            }
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
            user: user,
        });
    } catch (err) {
        console.error("Auth Me Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
