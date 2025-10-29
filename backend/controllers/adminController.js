import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";

// Register new institution admin
export const registerAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      jobTitle,
      phone,
      authorized,
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

    console.log("📝 Registration attempt for:", email);

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields",
        details: {
          fullName: !fullName ? "required" : "ok",
          email: !email ? "required" : "ok",
          password: !password ? "required" : "ok"
        }
      });
    }

    // Check existing admin
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("❌ Email already exists:", email);
      return res.status(400).json({ 
        message: "Admin already exists with this email.",
        email: email 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔒 Password hashed successfully");

    // Handle logo upload (optional)
    let logo = "";
    if (req.file) {
      logo = `/uploads/${req.file.filename}`;
      console.log("📷 Logo uploaded:", logo);
    }

    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      jobTitle,
      phone,
      authorized,
      institutionName,
      institutionType,
      website,
      address1,
      city,
      state,
      country,
      postalCode,
      description,
      logo,
      customURL,
      brandColor,
    });

    await newAdmin.save();
    console.log("✅ Admin registered successfully:", email);

    res.status(201).json({
      success: true,
      message: "Institution registered successfully!",
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        institutionName: newAdmin.institutionName,
        jobTitle: newAdmin.jobTitle,
      },
    });
  } catch (error) {
    console.error("❌ Admin Registration Error:", error);
    res.status(500).json({ 
      message: "Server error during registration", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Login admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);
    
    // Validate input
    if (!email || !password) {
      console.log("❌ Missing credentials");
      return res.status(400).json({ 
        message: "Email and password are required",
        details: {
          email: !email ? "missing" : "provided",
          password: !password ? "missing" : "provided"
        }
      });
    }

    // ✅ CRITICAL: Must use .select('+password') because schema has select: false
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.log("❌ No admin found with email:", email);
      return res.status(404).json({ 
        message: "No account found with this email",
        email: email
      });
    }

    console.log("✅ Admin found:", {
      id: admin._id,
      email: admin.email,
      hasPassword: !!admin.password,
      passwordLength: admin.password ? admin.password.length : 0,
      jobTitle: admin.jobTitle,
      institutionName: admin.institutionName
    });

    // Check if password exists
    if (!admin.password) {
      console.log("❌ Password field is undefined in database");
      return res.status(500).json({ 
        message: "Account configuration error. Please contact support.",
        debug: "Password field missing from database"
      });
    }

    // Compare passwords
    console.log("🔍 Comparing passwords...");
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(401).json({ 
        message: "Incorrect password",
        hint: "Please check your password and try again"
      });
    }

    console.log("✅ Password matched!");

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not found in environment variables");
      return res.status(500).json({ 
        message: "Server configuration error",
        debug: "JWT_SECRET not configured"
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email,
        role: admin.role || 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("🎫 JWT token generated");

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });

    console.log("🍪 Cookie set successfully");

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        institutionName: admin.institutionName,
        jobTitle: admin.jobTitle,
        role: admin.role || 'admin',
      },
    });

    console.log("✅ Login successful for:", email);

  } catch (error) {
    console.error("❌ Admin Login Error:", error);
    res.status(500).json({ 
      message: "Server error during login", 
      error: error.message,
      type: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 🔹 Logout Admin
export const logoutAdmin = (req, res) => {
  try {
    console.log("👋 Logout request");
    
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      expires: new Date(0),
      path: "/",
    });

    console.log("✅ Logout successful");

    res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error during logout",
      error: error.message
    });
  }
};

// 🔹 Get Admin Profile
export const getAdminProfile = async (req, res) => {
  try {
    console.log("👤 Profile request for user ID:", req.user?.id);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required",
        debug: "req.user not set by middleware"
      });
    }

    const admin = await Admin.findById(req.user.id).select("-password");
    
    if (!admin) {
      console.log("❌ Admin not found with ID:", req.user.id);
      return res.status(404).json({ 
        success: false, 
        message: "Admin profile not found",
        userId: req.user.id
      });
    }

    console.log("✅ Profile fetched for:", admin.email);

    res.status(200).json({
      success: true,
      user: admin,
    });
  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching profile",
      error: error.message
    });
  }
};
