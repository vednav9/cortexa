import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

/* =====================
   HTTP SERVER
===================== */
const server = http.createServer(app);
/* =====================
   SOCKET.IO
===================== */
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

// 🌍 Make io accessible in controllers
global.io = io;

io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // 👤 Join user-specific room
    socket.on("join:user", (userId) => {
        socket.join(`user:${userId}`);
        console.log(`👤 User joined room: user:${userId}`);
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
