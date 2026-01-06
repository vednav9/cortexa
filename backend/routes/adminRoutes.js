// routes/adminRoutes.js
import express from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getMyInstitution,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  bulkAddUsers
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* =========================
   AUTH ROUTES
========================= */

// Register Institution + Admin
router.post("/register", upload.single("logo"), registerAdmin);

// Login Admin
router.post("/login", loginAdmin);

// Logout Admin
router.post("/logout", authenticate, logoutAdmin);

/* =========================
   USER MANAGEMENT ROUTES
========================= */

// Get all users in institution (with filters)
router.get("/institutions/:institutionId/users", authenticate, getUsers);

// Add new user to institution
router.post("/institutions/:institutionId/users", authenticate, addUser);

// Bulk add multiple users to institution
router.post("/institutions/:institutionId/users/bulk", authenticate, bulkAddUsers);

// Update user
router.put("/users/:userId", authenticate, updateUser);

// Delete user
router.delete("/users/:userId/:role", authenticate, deleteUser);

// Toggle user status (active/inactive)
router.patch("/users/:userId/:role/status", authenticate, toggleUserStatus);

/* =========================
   DEBUG / PROFILE ROUTE
   (Optional but recommended)
========================= */
router.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get("/institution", authenticate, getMyInstitution);

export default router;
