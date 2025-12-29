// routes/adminRoutes.js
import express from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getMyInstitution
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
