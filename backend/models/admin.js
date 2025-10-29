import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    // Step 1 — Main Info
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    jobTitle: { type: String, enum: ["principal", "dean", "coworker"], required: true },
    phone: { type: String, required: true },
    authorized: { type: Boolean, default: false },

    // Step 2 — Institution Details
    institutionName: { type: String, required: true },
    institutionType: { type: String, required: true },
    website: { type: String },
    address1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    description: { type: String },

    // Step 3 — Branding
    logo: { type: String }, // URL of uploaded logo
    customURL: { type: String },
    brandColor: { type: String, default: "#34d399" },

    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
