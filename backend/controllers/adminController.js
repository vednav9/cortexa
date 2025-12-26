import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import Institution from "../models/institution.js";
import { uploadInstitutionLogo } from "../services/cloudflareR2.js";

// Helper function to generate unique slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to generate unique code
const generateCode = (name) => {
  const words = name.split(' ');
  if (words.length > 1) {
    return words.map(w => w.charAt(0)).join('').toUpperCase().substring(0, 6);
  }
  return name.substring(0, 6).toUpperCase();
};

// Register new institution admin (creates both institution and admin)
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

    // Validate required fields
    if (!fullName || !email || !password || !institutionName) {
      return res.status(400).json({
        message: "Missing required fields",
        details: {
          fullName: !fullName ? "required" : "ok",
          email: !email ? "required" : "ok",
          password: !password ? "required" : "ok",
          institutionName: !institutionName ? "required" : "ok"
        }
      });
    }

    // Check if admin email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists with this email.",
        email: email
      });
    }

    // Generate slug and code for institution
    const slug = customURL || generateSlug(institutionName);
    const code = generateCode(institutionName);

    // Check if institution slug already exists
    const existingInstitution = await Institution.findOne({ slug });
    if (existingInstitution) {
      return res.status(400).json({
        message: "Institution with this URL already exists. Please choose a different custom URL.",
        slug: slug
      });
    }

    // Handle logo upload to Cloudflare R2 (optional)
    let logo = "";
    if (req.file) {
      try {
        console.log("📤 Uploading logo to Cloudflare R2...");
        logo = await uploadInstitutionLogo(
          req.file.buffer, 
          req.file.originalname, 
          req.file.mimetype
        );
        console.log("✅ Logo uploaded successfully:", logo);
      } catch (uploadError) {
        console.error("❌ Logo upload failed:", uploadError);
        return res.status(500).json({
          message: "Failed to upload logo to cloud storage",
          error: uploadError.message
        });
      }
    }

    // Step 1: Create Institution first
    const newInstitution = new Institution({
      name: institutionName,
      slug: slug,
      code: code,
      type: institutionType.toLowerCase(),
      description: description || '',
      address: {
        street: address1,
        city: city,
        state: state,
        country: country,
        zipCode: postalCode
      },
      contact: {
        email: email,
        phone: phone,
        website: website
      },
      branding: {
        logo: logo,
        primaryColor: brandColor || '#0052A5',
        secondaryColor: '#FFFFFF',
        accentColor: brandColor || '#003366'
      },
      admins: [], // Will be populated after admin creation
      superAdmin: null, // Will be set after admin creation
      settings: {
        allowPublicJoin: false,
        requireApproval: true
      },
      stats: {
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        totalAdmins: 1
      }
    });

    // Step 2: Create Admin
    const newAdmin = new Admin({
      fullName,
      email,
      password,
      jobTitle,
      phone,
      institution: newInstitution._id, // Link to institution
      isSuperAdmin: true, // First admin is super admin
      permissions: {
        canAddAdmins: true,
        canManageStudents: true,
        canManageTeachers: true,
        canManageCourses: true,
        canViewReports: true,
        canEditInstitution: true
      },
      isActive: true,
      authorized: true, // First admin is auto-authorized
      addedBy: null // Self-registered
    });

    await newAdmin.save();

    // Step 3: Update institution with admin references
    newInstitution.superAdmin = newAdmin._id;
    newInstitution.admins.push(newAdmin._id);
    await newInstitution.save();

    console.log("✅ Institution and Admin registered successfully:", email);

    res.status(201).json({
      success: true,
      message: "Institution registered successfully!",
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        jobTitle: newAdmin.jobTitle,
      },
      institution: {
        id: newInstitution._id,
        name: newInstitution.name,
        slug: newInstitution.slug,
        code: newInstitution.code
      }
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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        details: {
          email: !email ? "missing" : "provided",
          password: !password ? "missing" : "provided"
        }
      });
    }

    // ✅ CRITICAL: Must use .select('+password') because schema has select: false
    const admin = await Admin.findOne({ email })
      .select('+password')
      .populate('institution', 'name slug code branding');

    if (!admin) {
      return res.status(404).json({
        message: "No account found with this email",
        email: email
      });
    }

    // Check if password exists
    if (!admin.password) {
      return res.status(500).json({
        message: "Account configuration error. Please contact support.",
        debug: "Password field missing from database"
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect password",
        hint: "Please check your password and try again"
      });
    }

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
        role: admin.role || 'admin',
        institutionId: admin.institution._id
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        jobTitle: admin.jobTitle,
        role: admin.role || 'admin',
        isSuperAdmin: admin.isSuperAdmin,
        permissions: admin.permissions,
        institution: {
          id: admin.institution._id,
          name: admin.institution.name,
          slug: admin.institution.slug,
          code: admin.institution.code,
          logo: admin.institution.branding?.logo
        }
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        debug: "req.user not set by middleware"
      });
    }

    const admin = await Admin.findById(req.user.id)
      .select("-password")
      .populate('institution', 'name slug code branding stats');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
        userId: req.user.id
      });
    }

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

// 🔹 Add New Admin to Institution (Super Admin Only)
export const addAdminToInstitution = async (req, res) => {
  try {
    const { fullName, email, password, jobTitle, phone, permissions } = req.body;

    // Check if requester is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // Get requester admin details
    const requesterAdmin = await Admin.findById(req.user.id);
    
    if (!requesterAdmin) {
      return res.status(404).json({
        message: "Admin account not found"
      });
    }

    // Check if requester has permission to add admins
    if (!requesterAdmin.isSuperAdmin && !requesterAdmin.permissions.canAddAdmins) {
      return res.status(403).json({
        message: "You don't have permission to add admins"
      });
    }

    // Validate required fields
    if (!fullName || !email || !password || !jobTitle) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        message: "An admin with this email already exists"
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      fullName,
      email,
      password,
      jobTitle,
      phone: phone || requesterAdmin.phone,
      institution: requesterAdmin.institution,
      isSuperAdmin: false,
      permissions: permissions || {
        canAddAdmins: false,
        canManageStudents: true,
        canManageTeachers: true,
        canManageCourses: true,
        canViewReports: true,
        canEditInstitution: false
      },
      isActive: true,
      authorized: true, // Auto-authorized when added by super admin
      addedBy: requesterAdmin._id
    });

    await newAdmin.save();

    // Add admin to institution
    const institution = await Institution.findById(requesterAdmin.institution);
    if (institution) {
      await institution.addAdmin(newAdmin._id);
    }

    res.status(201).json({
      success: true,
      message: "Admin added successfully",
      admin: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        jobTitle: newAdmin.jobTitle,
        permissions: newAdmin.permissions
      }
    });

  } catch (error) {
    console.error("❌ Add Admin Error:", error);
    res.status(500).json({
      message: "Error adding admin",
      error: error.message
    });
  }
};

// 🔹 Get All Admins of Institution
export const getAllInstitutionAdmins = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const requesterAdmin = await Admin.findById(req.user.id);
    
    if (!requesterAdmin) {
      return res.status(404).json({
        message: "Admin account not found"
      });
    }

    // Get all admins of the same institution
    const admins = await Admin.find({ 
      institution: requesterAdmin.institution,
      isActive: true 
    })
      .select('-password')
      .populate('addedBy', 'fullName email')
      .sort('-isSuperAdmin -createdAt');

    res.json({
      success: true,
      admins: admins.map(admin => ({
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        jobTitle: admin.jobTitle,
        phone: admin.phone,
        isSuperAdmin: admin.isSuperAdmin,
        permissions: admin.permissions,
        isActive: admin.isActive,
        addedBy: admin.addedBy,
        createdAt: admin.createdAt
      }))
    });

  } catch (error) {
    console.error("❌ Get Admins Error:", error);
    res.status(500).json({
      message: "Error fetching admins",
      error: error.message
    });
  }
};

// 🔹 Update Admin Permissions (Super Admin Only)
export const updateAdminPermissions = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const requesterAdmin = await Admin.findById(req.user.id);
    
    if (!requesterAdmin || !requesterAdmin.isSuperAdmin) {
      return res.status(403).json({
        message: "Only super admins can update permissions"
      });
    }

    const targetAdmin = await Admin.findById(adminId);
    
    if (!targetAdmin) {
      return res.status(404).json({
        message: "Admin not found"
      });
    }

    // Prevent modifying super admin permissions
    if (targetAdmin.isSuperAdmin) {
      return res.status(403).json({
        message: "Cannot modify super admin permissions"
      });
    }

    // Check if both admins are from same institution
    if (targetAdmin.institution.toString() !== requesterAdmin.institution.toString()) {
      return res.status(403).json({
        message: "Cannot modify admins from other institutions"
      });
    }

    targetAdmin.permissions = {
      ...targetAdmin.permissions,
      ...permissions
    };
    
    await targetAdmin.save();

    res.json({
      success: true,
      message: "Permissions updated successfully",
      admin: {
        id: targetAdmin._id,
        fullName: targetAdmin.fullName,
        permissions: targetAdmin.permissions
      }
    });

  } catch (error) {
    console.error("❌ Update Permissions Error:", error);
    res.status(500).json({
      message: "Error updating permissions",
      error: error.message
    });
  }
};

// 🔹 Remove/Deactivate Admin (Super Admin Only)
export const removeAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const requesterAdmin = await Admin.findById(req.user.id);
    
    if (!requesterAdmin || !requesterAdmin.isSuperAdmin) {
      return res.status(403).json({
        message: "Only super admins can remove admins"
      });
    }

    const targetAdmin = await Admin.findById(adminId);
    
    if (!targetAdmin) {
      return res.status(404).json({
        message: "Admin not found"
      });
    }

    // Prevent removing super admin
    if (targetAdmin.isSuperAdmin) {
      return res.status(403).json({
        message: "Cannot remove super admin"
      });
    }

    // Check if both admins are from same institution
    if (targetAdmin.institution.toString() !== requesterAdmin.institution.toString()) {
      return res.status(403).json({
        message: "Cannot remove admins from other institutions"
      });
    }

    // Deactivate instead of deleting
    targetAdmin.isActive = false;
    await targetAdmin.save();

    // Remove from institution admins array
    const institution = await Institution.findById(requesterAdmin.institution);
    if (institution) {
      await institution.removeAdmin(targetAdmin._id);
    }

    res.json({
      success: true,
      message: "Admin removed successfully"
    });

  } catch (error) {
    console.error("❌ Remove Admin Error:", error);
    res.status(500).json({
      message: "Error removing admin",
      error: error.message
    });
  }
};
