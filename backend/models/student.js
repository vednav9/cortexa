import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
    {
        fullName: { type: String, trim: true },

        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: { type: String },

        username: {
            type: String,
            unique: true,
            sparse: true, // ✅ allows null until profile completion
            trim: true,
        },

        phone: { type: String },

        role: {
            type: String,
            default: "student",
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

        enrolledCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],

        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            default: null, // ✅ THIS is what you want
        },

        year: { type: String },
        division: { type: String },
        enrollmentNumber: { type: String },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

// 🔒 Hash password before saving
studentSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
