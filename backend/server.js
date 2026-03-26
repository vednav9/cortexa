import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const SOCKET_DEBUG = process.env.SOCKET_DEBUG === "true";

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
    if (SOCKET_DEBUG) {
        console.log("[socket] connected", { socketId: socket.id });
    }

    socket.on("join:user", (userId) => {
        if (!userId) {
            console.warn("[socket] join:user received without userId", { socketId: socket.id });
            return;
        }
        socket.join(`user:${userId}`);
        if (SOCKET_DEBUG) {
            console.log("[socket] joined room", { socketId: socket.id, userId });
        }
    });

    socket.on("disconnect", (reason) => {
        if (SOCKET_DEBUG) {
            console.log("[socket] disconnected", { socketId: socket.id, reason });
        }
    });
});

io.engine.on("connection_error", (err) => {
    console.error("[socket] connection error", {
        code: err.code,
        message: err.message,
    });
});


/* =====================
   DATABASE
===================== */
mongoose.connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 50
})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));

/* =====================
   START SERVER
===================== */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
