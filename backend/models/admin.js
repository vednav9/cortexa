import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
    {
        // Step 1 — Main Info
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
        authorized: {
            type: Boolean,
            default: false,
        },

        // Step 2 — Institution Details
        institutionName: {
            type: String,
            required: true,
        },
        institutionType: {
            type: String,
            required: true,
        },
        website: {
            type: String,
        },
        address1: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        postalCode: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },

        // Step 3 — Branding
        logo: {
            type: String,
        }, // URL of uploaded logo
        customURL: {
            type: String,
            unique: true,
            sparse: true,
        },
        brandColor: {
            type: String,
            default: "#34d399",
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
