import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getMe, logout } from "../controllers/authController.js";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.post("/logout", logout);

export default router;
