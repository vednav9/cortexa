import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

// Debug endpoint to confirm this server instance is running
app.get('/api/__ping', (req, res) => {
    res.json({ ok: true, message: 'pong', time: new Date().toISOString() });
});

const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    "https://cortexa-beta.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"],
    },
});

// expose globally
global.io = io;

io.on("connection", (socket) => {
    console.log("🟢 SOCKET CONNECTED:", socket.id);

    socket.on("join:user", (userId) => {
        console.log("👤 User joined room:", userId);
        socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
    });
});


/* =====================
   DATABASE
===================== */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));

/* =====================
   START SERVER
===================== */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
