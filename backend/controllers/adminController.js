// controllers/adminController.js
import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";
import Institution from "../models/institution.js";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { uploadInstitutionLogo } from "../services/cloudflareR2.js";

// helpers
const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const generateCode = (name) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 6);

export const registerAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      jobTitle,
      phone,
      institutionName,
      institutionType,
      website,
      address1,
      city,
      state,
      country,
      postalCode,
      description,
      customURL,
      brandColor,
    } = req.body;

    // 🔴 BASIC VALIDATION
    if (
      !fullName ||
      !email ||
      !password ||
      !jobTitle ||
      !phone ||
      !institutionName ||
      !address1 ||
      !city ||
      !state ||
      !country
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 🔴 CHECK EXISTING ADMIN
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }

    // 🔹 UPLOAD LOGO (OPTIONAL)
    let logo = "";
    if (req.file) {
      logo = await uploadInstitutionLogo(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    // 🔹 CREATE INSTITUTION
    const institution = await Institution.create({
      name: institutionName,
      slug: customURL || generateSlug(institutionName),
      code: generateCode(institutionName),
      type: institutionType.toLowerCase(),
      description: description || "",

      address: {
        street: address1,
        city,
        state,
        country,
        zipCode: postalCode || "",
      },

      contact: {
        email,
        phone,
        website,
      },

      branding: {
        logo,
        primaryColor: brandColor || "#10b981",
      },
    });

    // 🔹 CREATE ADMIN
    const admin = await Admin.create({
      fullName,
      email,
      password,
      jobTitle,
      phone,
      institution: institution._id,
      role: "admin",
      isSuperAdmin: true,
      authorized: true,
    });

    // 🔹 LINK ADMIN ↔ INSTITUTION
    institution.admins.push(admin._id);
    institution.superAdmin = admin._id;
    await institution.save();

    // 🔹 AUTH TOKEN
    const token = generateToken({
      id: admin._id,
      role: "admin",
    });

    res.cookie("token", token, cookieOptions);

    // ✅ RESPONSE SHAPE (MATCHES FRONTEND)
    res.status(201).json({
      success: true,
      user: {
        id: admin._id,
        name: admin.fullName, // 🔥 IMPORTANT
        email: admin.email,
        role: "admin",
      },
    });

  } catch (error) {
    console.error("❌ Admin Register Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during admin registration",
    });
  }
};




/* =========================
   LOGIN ADMIN
========================= */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({ email })
      .select("+password")
      .populate("institution", "name slug code");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken({
      id: admin._id,
      role: "admin",
    });

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      user: {
        id: admin._id,
        name: admin.fullName, // ✅ IMPORTANT
        email: admin.email,
        role: "admin",
        institution: admin.institution
          ? {
            id: admin.institution._id,
            name: admin.institution.name,
            code: admin.institution.code,
          }
          : null,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during admin login",
    });
  }
};

/* =========================
   LOGOUT ADMIN
========================= */
export const logoutAdmin = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
};
