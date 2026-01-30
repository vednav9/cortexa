import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const teacherSchema = new mongoose.Schema(
    {
        fullName: { type: String, trim: true },

        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            select: false,
        },

        username: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        phone: { type: String },

        role: {
            type: String,
            default: "teacher",
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
            default: null,
        },

        authorizedCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],

        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            default: null, // ✅ REQUIRED
        },

        jobTitle: {
            type: String,
            default: null,
        },

        qualifications: {
            type: String,
            default: null,
        },

        specialization: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "inactive",
        },
    },
    { timestamps: true }
);

// 🔒 Password hashing
teacherSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

export default mongoose.model("Teacher", teacherSchema);
