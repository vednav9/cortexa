import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "student" },
    class: { type: String },
    division: { type: String },
    enrollmentNumber: { type: String }
}, { timestamps: true });

// ✅ Hash password before saving
studentSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
