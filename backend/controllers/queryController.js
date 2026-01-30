import mongoose from "mongoose";
import Query from "../models/query.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Admin from "../models/admin.js";

/* ===========================
   HELPERS
=========================== */

// Helper function to get user model based on role
const getUserModel = (role) => {
  if (!role) return null;

  const roleMap = {
    student: Student,
    teacher: Teacher,
    admin: Admin,
  };

  return roleMap[String(role).toLowerCase()] || null;
};

// Helper function to capitalize first letter
const capitalizeRole = (role) => {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

// Helper to safely get user name from different possible field names
const getUserName = (user) => {
  return user?.name || user?.fullName || user?.username || "Unknown User";
};

// Helper to safely get user email
const getUserEmail = (user) => {
  return user?.email || "";
};

// Helper to get user ID from token
const getUserId = (tokenUser) => {
  return tokenUser._id || tokenUser.userId || tokenUser.id;
};

/* ===========================
   GET ALL QUERIES
=========================== */

// Get all queries for an institution
export const getQueries = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { status, category, priority, search } = req.query;
    const userId = getUserId(req.user);
    const userRole = req.user.role;

    // Validate institutionId
    if (!mongoose.Types.ObjectId.isValid(institutionId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid institution ID" });
    }

    // Build query filter
    const filter = { institution: institutionId };

    // Role-based filtering: students only see their own queries
    if (userRole === "student") {
      filter["createdBy.userId"] = userId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const queries = await Query.find(filter).sort({ createdAt: -1 }).lean();

    res.json({ success: true, queries });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch queries" });
  }
};

/* ===========================
   GET SINGLE QUERY
=========================== */

// Get single query by ID
export const getQueryById = async (req, res) => {
  try {
    const { queryId } = req.params;
    const userId = getUserId(req.user);
    const userRole = req.user.role;

    // Validate queryId
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid query ID" });
    }

    const query = await Query.findById(queryId).lean();

    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    // Students can only view their own queries
    if (
      userRole === "student" &&
      query.createdBy.userId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, query });
  } catch (error) {
    console.error("Error fetching query:", error);
    res.status(500).json({ success: false, message: "Failed to fetch query" });
  }
};

/* ===========================
   CREATE QUERY
=========================== */

// Create new query
export const createQuery = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { title, description, category, priority } = req.body;
    const tokenUser = req.user;

    console.log("📝 ========== CREATE QUERY REQUEST ==========");
    console.log("Institution ID:", institutionId);
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Category:", category);
    console.log("Priority:", priority);
    console.log("User from token:", tokenUser);

    // Validate institutionId
    if (!mongoose.Types.ObjectId.isValid(institutionId)) {
      console.log("❌ Invalid institution ID");
      return res
        .status(400)
        .json({ success: false, message: "Invalid institution ID" });
    }

    // Validate required fields
    if (!title || !description) {
      console.log("❌ Missing title or description");
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Get userId from different possible fields
    const userId = getUserId(tokenUser);

    // Validate user ID
    if (!userId || !tokenUser.role) {
      console.log("❌ Invalid user data from token");
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication. Please log in again.",
      });
    }

    console.log("✅ User ID found:", userId);

    // Initialize user data
    let fullUser = {
      name: getUserName(tokenUser) || "Unknown User",
      email: getUserEmail(tokenUser) || "",
    };

    console.log("👤 Initial user data from token:", fullUser);

    // Try to fetch complete user data from database
    const UserModel = getUserModel(tokenUser.role);

    if (UserModel && userId) {
      try {
        console.log(`🔍 Fetching user from ${tokenUser.role} model...`);
        const dbUser = await UserModel.findById(userId)
          .select("name fullName email")
          .lean();

        if (dbUser) {
          console.log("✅ User found in database:", dbUser);
          fullUser = {
            name: getUserName(dbUser),
            email: getUserEmail(dbUser),
          };
        } else {
          console.log("⚠️ User not found in database with ID:", userId);
          // Still continue with available data
        }
      } catch (dbError) {
        console.warn(
          "⚠️ Error fetching user from database:",
          dbError.message
        );
      }
    }

    console.log("👤 Final user data to save:", fullUser);

    // Prepare query data
    const queryData = {
      title: title.trim(),
      description: description.trim(),
      category: category || "general",
      priority: priority || "normal",
      institution: new mongoose.Types.ObjectId(institutionId),
      createdBy: {
        userId: new mongoose.Types.ObjectId(userId),
        userModel: capitalizeRole(tokenUser.role),
        name: fullUser.name,
        email: fullUser.email,
      },
      status: "open",
      replies: [],
    };

    console.log("💾 Query data to save:", JSON.stringify(queryData, null, 2));

    // Create the query
    console.log("🔄 Creating query in database...");
    const query = await Query.create(queryData);

    console.log("✅ Query created successfully!");
    console.log("Query ID:", query._id);

    // Try to emit socket event
    try {
      if (global.io) {
        console.log("📡 Emitting socket event...");
        global.io.to(`institution:${institutionId}`).emit("new:query", {
          query,
          message: `New query from ${fullUser.name}: ${title}`,
        });
        console.log("✅ Socket event emitted");
      } else {
        console.log("⚠️ Socket.io not available");
      }
    } catch (socketError) {
      console.warn("⚠️ Socket emission failed:", socketError.message);
    }

    console.log("========== CREATE QUERY SUCCESS ==========");

    res.status(201).json({
      success: true,
      query,
      message: "Query created successfully",
    });
  } catch (error) {
    console.error("❌ ========== CREATE QUERY ERROR ==========");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Handle specific Mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      console.error("Validation errors:", validationErrors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error("Duplicate key error:", error.keyPattern);
      return res.status(400).json({
        success: false,
        message: "Duplicate entry detected",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create query",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/* ===========================
   ADD REPLY
=========================== */

// Add reply to query
export const addReply = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { text } = req.body;
    const tokenUser = req.user;
    const userId = getUserId(tokenUser);

    // Validate queryId
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid query ID" });
    }

    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Reply text is required" });
    }

    const query = await Query.findById(queryId);

    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    // Fetch full user data from database
    let fullUser = { name: getUserName(tokenUser) };

    const UserModel = getUserModel(tokenUser.role);

    if (UserModel && userId) {
      try {
        const dbUser = await UserModel.findById(userId)
          .select("name fullName")
          .lean();
        if (dbUser) {
          fullUser = { name: getUserName(dbUser) };
        }
      } catch (dbError) {
        console.warn("⚠️ Could not fetch user from database:", dbError.message);
      }
    }

    const reply = {
      text,
      repliedBy: {
        userId: userId,
        userModel: capitalizeRole(tokenUser.role),
        name: fullUser.name,
      },
      repliedAt: new Date(),
    };

    query.replies.push(reply);

    // Update status to in-progress if it's open
    if (query.status === "open") {
      query.status = "in-progress";
    }

    await query.save();

    // Emit socket event to query creator
    try {
      global.io?.to(`user:${query.createdBy.userId}`).emit("query:reply", {
        queryId: query._id,
        reply,
        message: `${fullUser.name} replied to your query`,
      });
    } catch (socketError) {
      console.warn("⚠️ Socket emission failed:", socketError.message);
    }

    res.json({ success: true, query, message: "Reply added successfully" });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add reply",
      error: error.message,
    });
  }
};

/* ===========================
   UPDATE QUERY STATUS
=========================== */

// Update query status
export const updateQueryStatus = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;
    const tokenUser = req.user;
    const userId = getUserId(tokenUser);

    // Validate queryId
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid query ID" });
    }

    if (!["open", "in-progress", "resolved", "closed"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const query = await Query.findById(queryId);

    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    query.status = status;

    if (status === "resolved" || status === "closed") {
      let resolvedUser = {
        name: getUserName(tokenUser),
      };

      const UserModel = getUserModel(tokenUser.role);

      if (UserModel && userId) {
        try {
          const dbUser = await UserModel.findById(userId)
            .select("name fullName")
            .lean();

          if (dbUser) {
            resolvedUser = { name: getUserName(dbUser) };
          }
        } catch (dbError) {
          console.warn("⚠️ Could not fetch user from database:", dbError.message);
        }
      }

      query.resolvedAt = new Date();
      query.resolvedBy = {
        userId: userId,
        userModel: capitalizeRole(tokenUser.role),
        name: resolvedUser.name,
      };
    }

    await query.save();

    // Emit socket event
    try {
      global.io?.to(`user:${query.createdBy.userId}`).emit("query:status", {
        queryId: query._id,
        status,
        message: `Your query status changed to ${status}`,
      });
    } catch (socketError) {
      console.warn("⚠️ Socket emission failed:", socketError.message);
    }

    res.json({ success: true, query, message: "Query status updated" });
  } catch (error) {
    console.error("Error updating query status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update query status",
      error: error.message,
    });
  }
};

/* ===========================
   DELETE QUERY
=========================== */

// Delete query (admin only)
export const deleteQuery = async (req, res) => {
  try {
    const { queryId } = req.params;

    // Validate queryId
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid query ID" });
    }

    const query = await Query.findByIdAndDelete(queryId);

    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    res.json({ success: true, message: "Query deleted successfully" });
  } catch (error) {
    console.error("Error deleting query:", error);
    res.status(500).json({ success: false, message: "Failed to delete query" });
  }
};

/* ===========================
   GET QUERY STATISTICS
=========================== */

// Get query statistics
export const getQueryStats = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const userId = getUserId(req.user);
    const userRole = req.user.role;

    // Validate institutionId
    if (!mongoose.Types.ObjectId.isValid(institutionId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid institution ID" });
    }

    const filter = { institution: institutionId };

    // Students only see their own stats
    if (userRole === "student") {
      filter["createdBy.userId"] = userId;
    }

    const [total, open, inProgress, resolved] = await Promise.all([
      Query.countDocuments(filter),
      Query.countDocuments({ ...filter, status: "open" }),
      Query.countDocuments({ ...filter, status: "in-progress" }),
      Query.countDocuments({ ...filter, status: "resolved" }),
    ]);

    res.json({
      success: true,
      stats: { total, open, inProgress, resolved },
    });
  } catch (error) {
    console.error("Error fetching query stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};
