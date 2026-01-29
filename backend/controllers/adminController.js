import Admin from "../models/admin.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Institution from "../models/institution.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { uploadInstitutionLogo, uploadInstitutionBanner } from "../services/cloudflareR2.js";

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

const getInstitutionStats = async (institutionId) => {
  const [students, teachers] = await Promise.all([
    Student.countDocuments({ institution: institutionId }),
    Teacher.countDocuments({ institution: institutionId }),
  ]);

  return { students, teachers };
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
      username,
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
      !username ||
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

    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Username is required",
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

    // Check if username is already taken
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // 🔹 UPLOAD LOGO/BANNER (OPTIONAL)
    // Using upload.fields() so files appear in req.files.{logo|banner}[0]
    let logo = "";
    let banner = "";
    const logoFile = req.files?.logo?.[0];
    const bannerFile = req.files?.banner?.[0];

    if (logoFile) {
      logo = await uploadInstitutionLogo(
        logoFile.buffer,
        logoFile.originalname,
        logoFile.mimetype
      );
    }

    if (bannerFile) {
      banner = await uploadInstitutionBanner(
        bannerFile.buffer,
        bannerFile.originalname,
        bannerFile.mimetype
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
        banner,
        primaryColor: brandColor || "#10b981",
      },
    });

    // 🔹 CREATE ADMIN
    const admin = await Admin.create({
      fullName,
      email,
      password,
      username,
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

    const admin = await Admin.findOne({ 
      $or: [{ email }, { username: email }] 
    })
      .select("+password")
      .populate("institution", "name code");

    if (!admin) {
      // Check if email/username exists in other roles
      const student = await Student.findOne({ 
        $or: [{ email }, { username: email }] 
      });
      if (student) {
        return res.status(400).json({
          success: false,
          message: "This account is registered as a Student. Please select Student role.",
        });
      }

      const teacher = await Teacher.findOne({ 
        $or: [{ email }, { username: email }] 
      });
      if (teacher) {
        return res.status(400).json({
          success: false,
          message: "This account is registered as a Teacher. Please select Teacher role.",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Invalid email/username or password",
      });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password",
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
    const admin = await Admin.findById(req.user.id).populate("institution");

    if (!admin || !admin.institution) {
      return res.json({ institution: null });
    }

    const institutionId = admin.institution._id;

    // 🔥 DYNAMIC COUNTS
    const [studentsCount, teachersCount] = await Promise.all([
      Student.countDocuments({ institution: institutionId }),
      Teacher.countDocuments({ institution: institutionId }),
    ]);

    res.json({
      institution: {
        ...admin.institution.toObject(),
        stats: {
          students: studentsCount,
          teachers: teachersCount,
          courses: 0, // placeholder for future
        },
      },
    });
  } catch (error) {
    console.error("getMyInstitution error:", error);
    res.status(500).json({ message: "Failed to fetch institution" });
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
    const { role = "all", status, department, search } = req.query;

    // 🔐 Verify admin
    const admin = await Admin.findById(req.user._id);
    if (!admin || admin.institution.toString() !== institutionId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 🔎 Common filters
    const buildQuery = () => {
      const q = { institution: institutionId };

      if (status) q.status = status;
      if (department) q.department = department;

      if (search) {
        q.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      return q;
    };

    let users = [];
    let students = [];
    let teachers = [];

    // 👥 FETCH STUDENTS
    if (role === "all" || role === "student") {
      students = await Student.find(buildQuery())
        .populate("department", "name code")
        .populate("semester", "name academicYear")
        .lean();

      students = students.map(u => ({ ...u, role: "student" }));
    }

    // 👥 FETCH TEACHERS
    if (role === "all" || role === "teacher") {
      teachers = await Teacher.find(buildQuery())
      .populate("department", "name")
      .populate("authorizedCourses", "name code")
      .lean();
    
    teachers = teachers.map(u => ({ ...u, role: "teacher" }));
    
    }

    users = [...students, ...teachers];

    // 📊 STATS
    const stats = {
      total: users.length,
      students: students.length,
      teachers: teachers.length,
      active: users.filter(u => u.status === "active").length,
      inactive: users.filter(u => u.status === "inactive").length,
    };

    res.json({
      success: true,
      users,
      stats,
    });

  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};




// Add new user
export const addUser = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { role, fullName, email, password, phone, department, semester, expertise, jobTitle, authorizedCourses } = req.body;

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
      // Create student
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

      // Auto-enroll in courses based on department and semester
      if (department && semester) {
        const Course = (await import('../models/course.js')).default;
        const coursesToEnroll = await Course.find({
          institution: institutionId,
          department,
          semesterAvailable: semester,
          isActive: true
        }).select('_id');

        if (coursesToEnroll.length > 0) {
          newUser.enrolledCourses = coursesToEnroll.map(c => c._id);
          await newUser.save();
        }
      }
    } else if (role === 'teacher') {
      // Create teacher with authorized courses
      newUser = await Teacher.create({
        fullName,
        email,
        password: hashedPassword,
        phone,
        department,
        expertise,
        institution: institutionId,
        status: 'active',
        authorizedCourses: authorizedCourses || [] // Only selected courses
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

// Bulk add multiple users (CSV import - students only, no teachers via CSV per requirements)
export const bulkAddUsers = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { users } = req.body;

    console.log('Bulk upload request:', {
      institutionId,
      userId: req.user.id,
      userRole: req.user.role,
      usersCount: users?.length
    });

    // Verify admin permissions
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      console.error('Admin not found:', req.user.id);
      return res.status(403).json({ message: "Admin not found" });
    }

    if (admin.institution.toString() !== institutionId) {
      return res.status(403).json({ 
        message: "Access denied - Institution mismatch"
      });
    }

    // Validate institution exists
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Validate users array
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "Users array is required and must not be empty" });
    }

    const Course = (await import('../models/course.js')).default;
    
    const results = {
      successCount: 0,
      errors: []
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];

      try {
        // Validate required fields
        if (!userData.fullName || !userData.email || !userData.mobile || !userData.department || !userData.username || !userData.role) {
          results.errors.push({
            index: i,
            email: userData.email || 'unknown',
            error: 'Missing required fields'
          });
          continue;
        }

        // CSV upload only for students (per user requirements)
        if (userData.role !== 'student') {
          results.errors.push({
            index: i,
            email: userData.email,
            error: 'CSV upload only supports students. Teachers must be added manually.'
          });
          continue;
        }

        // Check for duplicate email in database
        const existingStudent = await Student.findOne({ email: userData.email });
        const existingTeacher = await Teacher.findOne({ email: userData.email });
        const existingAdmin = await Admin.findOne({ email: userData.email });

        if (existingStudent || existingTeacher || existingAdmin) {
          results.errors.push({
            index: i,
            email: userData.email,
            error: 'Email already exists'
          });
          continue;
        }

        // Generate default password
        const defaultPassword = 'Welcome@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Validate student-specific fields
        if (!userData.semester) {
          results.errors.push({
            index: i,
            email: userData.email,
            error: 'Semester is required for students'
          });
          continue;
        }

        // Create student
        const newStudent = await Student.create({
          fullName: userData.fullName,
          email: userData.email,
          password: hashedPassword,
          username: userData.username,
          phone: userData.mobile,
          department: userData.department,
          semester: userData.semester,
          institution: institutionId,
          status: 'active'
        });

        // Auto-enroll in courses based on department and semester
        if (userData.department && userData.semester) {
          const coursesToEnroll = await Course.find({
            institution: institutionId,
            department: userData.department,
            semesterAvailable: userData.semester,
            isActive: true
          }).select('_id');

          if (coursesToEnroll.length > 0) {
            newStudent.enrolledCourses = coursesToEnroll.map(c => c._id);
            await newStudent.save();
          }
        }

        results.successCount++;

      } catch (error) {
        results.errors.push({
          index: i,
          email: userData.email || 'unknown',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${results.successCount} students added successfully.`,
      successCount: results.successCount,
      errors: results.errors,
      totalProcessed: users.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to bulk add users" });
  }
};

export const removeUserFromInstitution = async (req, res) => {
  try {
    const { userId, role } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let user;

    if (role === "student") {
      user = await Student.findById(userId);
    } else if (role === "teacher") {
      user = await Teacher.findById(userId);
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 REMOVE FROM INSTITUTION
    user.institution = null;
    user.status = "inactive";
    await user.save();

    // 🔔 REALTIME NOTIFY USER
    global.io.to(`user:${userId}`).emit("institution-removed", {
      message: "You have been removed from the institution",
    });

    res.json({
      success: true,
      message: "User removed from institution successfully",
    });
  } catch (error) {
    console.error("REMOVE USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET STUDENTS BY INSTITUTION (for Dashboard)
// ============================================
export const getInstitutionStudents = async (req, res) => {
  try {
    const { institutionId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin || admin.institution.toString() !== institutionId) {
      return res.status(403).json({ message: "Not authorized for this institution" });
    }

    const students = await Student.find({ institution: institutionId })
      .populate('department', 'name code')
      .populate('semester', 'name academicYear')
      .select('-password')
      .sort('-createdAt');

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET TEACHERS BY INSTITUTION (for Dashboard)
// ============================================
export const getInstitutionTeachers = async (req, res) => {
  try {
    const { institutionId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin || admin.institution.toString() !== institutionId) {
      return res.status(403).json({ message: "Not authorized for this institution" });
    }

    const teachers = await Teacher.find({ institution: institutionId })
      .populate('department', 'name code')
      .populate('semester', 'name academicYear')
      .populate('authorizedCourses', 'name code')
      .select('-password')
      .sort('-createdAt');

    res.json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


