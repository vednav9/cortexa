import express from "express";
import { authenticate } from "../middleware/auth.js";

// Admin auth
import {
    registerCortexaAdmin,
    loginCortexaAdmin,
} from "../controllers/cortexaAdminController.js";

// Notifications
import {
    sendGlobalNotification,
    getNotifications,
} from "../controllers/cortexaNotificationController.js";

const router = express.Router();

/* =========================
   CORTEXA ADMIN AUTH
========================= */

// One-time setup (you can delete later)
router.post("/register", registerCortexaAdmin);

// Login
router.post("/login", loginCortexaAdmin);

// Get logged-in admin
router.get("/me", authenticate, (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});

/* =========================
   NOTIFICATIONS
========================= */

// Send global notification
router.post("/notifications", authenticate, sendGlobalNotification);

// Fetch notifications
router.get("/notifications", authenticate, getNotifications);

export default router;
