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
    const { role, status, department, search } = req.query;

    // 🔐 verify admin
    const admin = await Admin.findById(req.user.id);
    if (!admin || admin.institution.toString() !== institutionId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const baseQuery = { institution: institutionId };

    if (status) baseQuery.status = status;
    if (department) baseQuery.department = department;

    if (search) {
      baseQuery.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    let users = [];

    if (!role || role === "all") {
      const [students, teachers] = await Promise.all([
        Student.find(baseQuery).lean(),
        Teacher.find(baseQuery).lean()
      ]);

      users = [
        ...students.map(u => ({ ...u, role: "student" })),
        ...teachers.map(u => ({ ...u, role: "teacher" }))
      ];
    }

    if (role === "student") {
      users = (await Student.find(baseQuery).lean())
        .map(u => ({ ...u, role: "student" }));
    }

    if (role === "teacher") {
      users = (await Teacher.find(baseQuery).lean())
        .map(u => ({ ...u, role: "teacher" }));
    }

    res.json({ success: true, users });

  } catch (err) {
    console.error("getUsers error:", err);
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

// // Bulk add multiple users
// export const bulkAddUsers = async (req, res) => {
//   try {
//     const { institutionId } = req.params;
//     const { users } = req.body;

//     console.log('Bulk upload request:', {
//       institutionId,
//       userId: req.user.id,
//       userRole: req.user.role,
//       usersCount: users?.length
//     });

//     // Verify admin permissions
//     const admin = await Admin.findById(req.user.id);
//     if (!admin) {
//       console.error('Admin not found:', req.user.id);
//       return res.status(403).json({ message: "Admin not found" });
//     }

//     console.log('Admin institution:', admin.institution.toString());
//     console.log('Requested institution:', institutionId);

//     if (admin.institution.toString() !== institutionId) {
//       console.error('Institution mismatch:', {
//         adminInstitution: admin.institution.toString(),
//         requestedInstitution: institutionId
//       });
//       return res.status(403).json({ 
//         message: "Access denied - Institution mismatch",
//         adminInstitution: admin.institution.toString(),
//         requestedInstitution: institutionId
//       });
//     }

//     // Validate institution exists
//     const institution = await Institution.findById(institutionId);
//     if (!institution) {
//       return res.status(404).json({ message: "Institution not found" });
//     }

//     // Validate users array
//     if (!Array.isArray(users) || users.length === 0) {
//       return res.status(400).json({ message: "Users array is required and must not be empty" });
//     }

//     const results = {
//       successCount: 0,
//       errors: []
//     };

//     // Process each user
//     for (let i = 0; i < users.length; i++) {
//       const userData = users[i];

//       try {
//         // Validate required fields
//         if (!userData.fullName || !userData.email || !userData.mobile || !userData.department || !userData.username || !userData.role) {
//           results.errors.push({
//             index: i,
//             email: userData.email || 'unknown',
//             error: 'Missing required fields'
//           });
//           continue;
//         }

//         // Check for duplicate email in database
//         const existingStudent = await Student.findOne({ email: userData.email });
//         const existingTeacher = await Teacher.findOne({ email: userData.email });
//         const existingAdmin = await Admin.findOne({ email: userData.email });

//         if (existingStudent || existingTeacher || existingAdmin) {
//           results.errors.push({
//             index: i,
//             email: userData.email,
//             error: 'Email already exists'
//           });
//           continue;
//         }

//         // Generate default password
//         const defaultPassword = 'Welcome@123';
//         const hashedPassword = await bcrypt.hash(defaultPassword, 10);

//         // Create user based on role
//         if (userData.role === 'student') {
//           // Validate student-specific fields
//           if (!userData.year || !userData.division) {
//             results.errors.push({
//               index: i,
//               email: userData.email,
//               error: 'Year and division are required for students'
//             });
//             continue;
//           }

//           await Student.create({
//             fullName: userData.fullName,
//             email: userData.email,
//             password: hashedPassword,
//             username: userData.username,
//             phone: userData.mobile,
//             department: userData.department,
//             institution: institutionId,
//             year: userData.year,
//             division: userData.division,
//             status: 'active'
//           });

//           results.successCount++;

//         } else if (userData.role === 'teacher') {
//           // Validate teacher-specific fields
//           if (!userData.jobTitle || !userData.qualifications) {
//             results.errors.push({
//               index: i,
//               email: userData.email,
//               error: 'Job title and qualifications are required for teachers'
//             });
//             continue;
//           }

//           await Teacher.create({
//             fullName: userData.fullName,
//             email: userData.email,
//             password: hashedPassword,
//             username: userData.username,
//             phone: userData.mobile,
//             department: userData.department,
//             institution: institutionId,
//             jobTitle: userData.jobTitle,
//             qualifications: userData.qualifications,
//             specialization: userData.specialization || '',
//             status: 'active'
//           });

//           results.successCount++;

//         } else {
//           results.errors.push({
//             index: i,
//             email: userData.email,
//             error: 'Invalid role. Must be student or teacher'
//           });
//         }

//       } catch (error) {
//         results.errors.push({
//           index: i,
//           email: userData.email || 'unknown',
//           error: error.message
//         });
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: `Bulk upload completed. ${results.successCount} users added successfully.`,
//       successCount: results.successCount,
//       errors: results.errors,
//       totalProcessed: users.length
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to bulk add users" });
//   }
// };


export const removeUserFromInstitution = async (req, res) => {
  try {
    const { userId, role } = req.params;

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    let user;

    if (role === "student") {
      user = await Student.findById(userId);
    } else {
      user = await Teacher.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 Already removed
    if (!user.institution) {
      return res.status(400).json({ message: "User not part of any institution" });
    }

    // ✅ Remove institution
    user.institution = null;
    user.status = "inactive";
    await user.save();

    res.json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} removed from institution`,
    });
  } catch (error) {
    console.error("Remove user error:", error);
    res.status(500).json({ message: "Failed to remove user" });
  }
};
