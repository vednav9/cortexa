import { io } from "socket.io-client";
import { SOCKET_URL } from "./config/api";

export const socket = io(SOCKET_URL, {
    autoConnect: false, // ❗ VERY IMPORTANT
    // Vercel serverless does not support WebSocket upgrades.
    // Use polling only in production; allow websocket upgrade locally.
    transports: import.meta.env.PROD ? ["polling"] : ["websocket", "polling"],
    withCredentials: true,
});
