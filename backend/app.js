import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import studentrouter from "./routes/studentRoutes.js"
import teacherrouter from "./routes/teacherRoutes.js"
import adminrouter from "./routes/adminRoutes.js";
import airouter from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";

//testing
// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173",  // Your React app URL
    credentials: true  // Allow cookies to be sent/received
}));

app.use(cookieParser());

app.use(express.json());

// Serve uploaded files as static files
app.use('/uploads', express.static('uploads'));

// Increase timeout for AI routes (2 minutes)
app.use('/api/ai', (req, res, next) => {
    req.setTimeout(180000); // 3 minutes (increased from 2)
    res.setTimeout(180000); // 3 minutes (increased from 2)
    next();
});

// Example Route
app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use("/api/student", studentrouter);
app.use("/api/teacher", teacherrouter);
app.use("/api/admin", adminrouter);
app.use('/api/ai', airouter);
app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/announcements", announcementRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));


// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
