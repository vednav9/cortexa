import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { type: String, default: "student" },
    department: { type: String, required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },
    year: { type: String, required: true },
    division: { type: String, required: true },
    enrollmentNumber: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

// ✅ Hash password before saving
studentSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
