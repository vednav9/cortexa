import Admin from "../models/admin.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
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
   Get ADMIN Institution
========================= */

export const getMyInstitution = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id)
      .populate("institution");

    if (!admin || !admin.institution) {
      return res.json({ institution: null });
    }

    res.json({
      institution: admin.institution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch admin institution",
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

/* =========================
   USER MANAGEMENT (CRUD)
========================= */

// Get all users in institution
export const getUsers = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { role, status, department, search } = req.query;

    // Verify admin belongs to this institution
    const admin = await Admin.findById(req.user.id);
    if (admin.institution.toString() !== institutionId) {
      return res.status(403).json({ message: "Access denied" });
    }

    let query = { institution: institutionId };

    // Apply filters
    if (status) query.status = status;
    if (department) query.department = department;

    // Build search query
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    let users = [];

    // Fetch based on role filter
    if (!role || role === 'all') {
      const [students, teachers, admins] = await Promise.all([
        Student.find(query).select('-password').lean(),
        Teacher.find(query).select('-password').lean(),
        Admin.find({ institution: institutionId }).select('-password').lean()
      ]);
      
      users = [
        ...students.map(s => ({ ...s, role: 'student' })),
        ...teachers.map(t => ({ ...t, role: 'teacher' })),
        ...admins.map(a => ({ ...a, role: 'admin' }))
      ];
    } else if (role === 'student') {
      const students = await Student.find(query).select('-password').lean();
      users = students.map(s => ({ ...s, role: 'student' }));
    } else if (role === 'teacher') {
      const teachers = await Teacher.find(query).select('-password').lean();
      users = teachers.map(t => ({ ...t, role: 'teacher' }));
    } else if (role === 'admin') {
      const admins = await Admin.find({ institution: institutionId }).select('-password').lean();
      users = admins.map(a => ({ ...a, role: 'admin' }));
    }

    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Add new user
export const addUser = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { role, fullName, email, password, phone, department, semester, expertise, jobTitle } = req.body;

    // Verify admin belongs to this institution
    const admin = await Admin.findById(req.user.id);
    if (admin.institution.toString() !== institutionId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user already exists
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });

    if (existingStudent || existingTeacher || existingAdmin) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;

    if (role === 'student') {
      newUser = await Student.create({
        fullName,
        email,
        password: hashedPassword,
        phone,
        department,
        semester,
        institution: institutionId,
        status: 'active'
      });
    } else if (role === 'teacher') {
      newUser = await Teacher.create({
        fullName,
        email,
        password: hashedPassword,
        phone,
        department,
        expertise,
        institution: institutionId,
        status: 'active'
      });
    } else if (role === 'admin') {
      newUser = await Admin.create({
        fullName,
        email,
        password: hashedPassword,
        phone,
        jobTitle,
        institution: institutionId
      });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully`,
      user: { ...userResponse, role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add user" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, fullName, email, phone, department, semester, expertise, status, jobTitle } = req.body;

    // Verify admin permissions
    const admin = await Admin.findById(req.user.id);
    
    let updatedUser;
    const updateData = { fullName, email, phone, department, status };

    if (role === 'student') {
      if (semester) updateData.semester = semester;
      updatedUser = await Student.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    } else if (role === 'teacher') {
      if (expertise) updateData.expertise = expertise;
      updatedUser = await Teacher.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    } else if (role === 'admin') {
      if (jobTitle) updateData.jobTitle = jobTitle;
      updatedUser = await Admin.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: { ...updatedUser.toObject(), role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId, role } = req.params;

    // Verify admin permissions
    const admin = await Admin.findById(req.user.id);
    
    let deletedUser;

    if (role === 'student') {
      deletedUser = await Student.findByIdAndDelete(userId);
    } else if (role === 'teacher') {
      deletedUser = await Teacher.findByIdAndDelete(userId);
    } else if (role === 'admin') {
      // Prevent deleting yourself
      if (userId === req.user.id) {
        return res.status(400).json({ message: "You cannot delete yourself" });
      }
      deletedUser = await Admin.findByIdAndDelete(userId);
    }

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Toggle user status
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId, role } = req.params;

    let user;

    if (role === 'student') {
      user = await Student.findById(userId);
    } else if (role === 'teacher') {
      user = await Teacher.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: "User status updated",
      user: { ...userResponse, role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to toggle user status" });
  }
};
