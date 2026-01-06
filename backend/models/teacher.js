import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const teacherSchema = new mongoose.Schema(
    {
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

        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
        },

        role: {
            type: String,
            default: "teacher",
        },

        department: {
            type: String,
            required: [true, "Department is required"],
            trim: true,
        },

        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: [true, "Institution is required"],
        },

        jobTitle: {
            type: String,
            required: [true, "Job title is required"],
            trim: true,
        },

        qualifications: {
            type: String,
            required: [true, "Qualifications are required"],
            trim: true,
        },

        specialization: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

// 🔒 Hash password before saving
teacherSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 🔑 Compare password method
teacherSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
