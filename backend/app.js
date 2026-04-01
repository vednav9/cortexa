import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
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
import teacherQARoutes from "./routes/teacherQARoutes.js";
import studentQARoutes from "./routes/studentQARoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import qaRoutes from './routes/qaRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import studentRagRoutes from './routes/studentRagRoutes.js';
import studentMCQRoutes from './routes/studentMCQRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Keep normal logs enabled by default.
// Set LOG_LEVEL=silent only when you explicitly want to mute logs.
if (process.env.LOG_LEVEL === "silent" && !global.__cortexaLogsMinimized) {
    global.__cortexaLogsMinimized = true;
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
}

const app = express();

/* =====================
   MIDDLEWARE
===================== */
const allowedOrigins = [
    "http://localhost:5173",
    "https://cortexa-beta.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
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
app.use("/api/teacher-qa", teacherQARoutes);
app.use("/api/student-qa", studentQARoutes);
app.use("/api/queries", queryRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/student/rag', studentRagRoutes);
app.use('/api/student-mcq', studentMCQRoutes);

console.log("✅ All routes registered successfully");

export default app;
