import express from "express";
import { registerStudent, loginStudent } from "../controllers/studentController.js"
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);

router.get("/check-auth", authenticate, (req, res) => {
    res.status(200).json({
        success: true,
        message: "User is authenticated",
        user: req.user
    });
});

export default router;
