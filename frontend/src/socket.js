import { io } from "socket.io-client";
import { SOCKET_URL } from "./config/api";

const getSocketHostname = (url) => {
    try {
        return new URL(url).hostname;
    } catch {
        return "";
    }
};

const socketHost = getSocketHostname(SOCKET_URL);
const isVercelSocketTarget = /\.vercel\.app$/i.test(socketHost);
export const isRealtimeSocketEnabled = !isVercelSocketTarget;

export const socket = io(SOCKET_URL, {
    autoConnect: false, // ❗ VERY IMPORTANT
    // Vercel serverless does not support WebSocket upgrades.
    // Use polling only for Vercel targets; allow websocket upgrade otherwise.
    transports: isVercelSocketTarget ? ["polling"] : ["websocket", "polling"],
    upgrade: !isVercelSocketTarget,
    withCredentials: true,
});
