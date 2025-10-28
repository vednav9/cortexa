import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
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
            select: false,
        },

        role: {
            type: String,
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

// 🔑 Compare password
studentSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model("Student", studentSchema);
export default Student;
