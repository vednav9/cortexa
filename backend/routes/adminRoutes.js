import express from "express";
import {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getAdminProfile,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";



const router = express.Router();

router.post("/register", upload.single("logo"), registerAdmin);

router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/me", authenticate, getAdminProfile);




export default router;
