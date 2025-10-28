import express from "express";
import { registerTeacher, loginTeacher } from "../controllers/teacherController";

const router = express.Router();

router.post("/register", registerTeacher);
router.post("/login", loginTeacher);