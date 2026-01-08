import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import studentrouter from "./routes/studentRoutes.js";
import teacherrouter from "./routes/teacherRoutes.js";
import adminrouter from "./routes/adminRoutes.js";
import airouter from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import cortexaAdminRoutes from "./routes/cortexaAdminRoutes.js";


dotenv.config();

const app = express();

/* =====================
   MIDDLEWARE
===================== */
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

/* =====================
   ROUTES
===================== */
app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use("/api/student", studentrouter);
app.use("/api/teacher", teacherrouter);
app.use("/api/admin", adminrouter);
app.use("/api/ai", airouter);
app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/cortexa-admin", cortexaAdminRoutes);


export default app;
