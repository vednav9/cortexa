import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
    {
        // Personal Information
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
            select: false, // hidden by default
        },
        jobTitle: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        
        // Institution Reference
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Institution',
            required: true
        },
        
        // Admin Privileges
        isSuperAdmin: {
            type: Boolean,
            default: false, // First admin of institution becomes super admin
        },
        permissions: {
            canAddAdmins: {
                type: Boolean,
                default: false,
            },
            canManageStudents: {
                type: Boolean,
                default: true,
            },
            canManageTeachers: {
                type: Boolean,
                default: true,
            },
            canManageCourses: {
                type: Boolean,
                default: true,
            },
            canViewReports: {
                type: Boolean,
                default: true,
            },
            canEditInstitution: {
                type: Boolean,
                default: false,
            }
        },
        
        // Status
        isActive: {
            type: Boolean,
            default: true,
        },
        authorized: {
            type: Boolean,
            default: false, // Needs approval from super admin
        },
        
        // Added by
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null
        },

        role: {
            type: String,
            default: "admin",
        },
    },
    { timestamps: true }
);

// 🔒 Hash password before saving
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 🔑 Compare password method
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
