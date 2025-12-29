import Admin from "../models/admin.js";
import Institution from "../models/institution.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { uploadInstitutionLogo } from "../services/cloudflareR2.js";

// helpers
const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const generateUniqueCode = async (name) => {
  const baseCode = name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 6)
    .toUpperCase();

  let code = baseCode;
  let counter = 1;

  while (await Institution.exists({ code })) {
    code = `${baseCode}${counter}`; // NHIOTA1, NHIOTA2...
    counter++;
  }

  return code;
};

/* =========================
   REGISTER ADMIN + INSTITUTION
========================= */
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

    // 🔴 REQUIRED FIELDS CHECK
    if (
      !fullName ||
      !email ||
      !password ||
      !jobTitle ||
      !phone ||
      !institutionName ||
      !institutionType ||
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
    const exists = await Admin.findOne({ email });
    if (exists) {
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

    // ✅ GENERATE UNIQUE CODE (INSIDE FUNCTION)
    const code = await generateUniqueCode(institutionName);

    // 🔹 CREATE INSTITUTION
    const institution = await Institution.create({
      name: institutionName,
      slug: customURL || slugify(institutionName),
      code, // ✅ FIXED
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
    });

    institution.admins.push(admin._id);
    await institution.save();

    // 🔹 AUTH TOKEN
    const token = generateToken({
      id: admin._id,
      role: "admin",
    });

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      user: {
        id: admin._id,
        name: admin.fullName,
        email: admin.email,
        role: "admin",
      },
    });

  } catch (err) {
    console.error("Admin register error:", err);
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

    const admin = await Admin.findOne({ email })
      .select("+password")
      .populate("institution", "name code");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
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

    res.json({
      success: true,
      user: {
        id: admin._id,
        name: admin.fullName,
        email: admin.email,
        role: "admin",
        institution: admin.institution,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

/* =========================
   LOGOUT ADMIN
========================= */
export const logoutAdmin = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true });
};
