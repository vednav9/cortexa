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
  removeUserFromInstitution,
} from "../controllers/adminController.js";

import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* =========================
   AUTH
========================= */
// Accept optional `logo` and `banner` uploads in the same multipart request.
// Keep fields optional so existing clients continue working.
router.post(
  "/register",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  registerAdmin
);
router.post("/login", loginAdmin);
router.post("/logout", authenticate, logoutAdmin);

/* =========================
   INSTITUTION
========================= */
router.get("/institution", authenticate, getMyInstitution);

/* =========================
   USER MANAGEMENT
========================= */

// Get users in institution
router.get(
  "/institutions/:institutionId/users",
  authenticate,
  getUsers
);

// Add user
router.post(
  "/institutions/:institutionId/users",
  authenticate,
  addUser
);

// Update user
router.put(
  "/users/:userId",
  authenticate,
  updateUser
);

// Toggle active/inactive
router.patch(
  "/users/:userId/:role/status",
  authenticate,
  toggleUserStatus
);

// ✅ REMOVE USER FROM INSTITUTION (IMPORTANT)
router.patch(
  "/users/:userId/:role/remove",
  authenticate,
  removeUserFromInstitution
);

// ❌ PERMANENT DELETE (USE CAREFULLY)
router.delete(
  "/users/:userId/:role",
  authenticate,
  deleteUser
);

export default router;
