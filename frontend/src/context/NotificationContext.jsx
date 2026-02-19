import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "../socket";
import { useAuth } from "./authcontext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    // 🔔 ADD notification
    const addNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
    };

    // 🧹 Clear all
    const clearNotifications = () => {
        setNotifications([]);
    };

    // 🔌 SOCKET LISTENER
    // NOTE: Socket.io real-time only works when backend is on a persistent server
    // (Railway, Render, etc.). On Vercel serverless, WebSockets are not supported.
    const isSocketEnabled = !import.meta.env.PROD;

    useEffect(() => {
        if (!user?._id) return;
        if (!isSocketEnabled) return; // Skip on Vercel — no WebSocket support

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit("join:user", user._id);
        console.log("👤 Joined notification room:", user._id);

        const handleInvitation = (data) => {
            console.log("🔔 CONTEXT RECEIVED:", data);
            addNotification(data);
        };

        socket.on("invitation:new", handleInvitation);

        return () => {
            socket.off("invitation:new", handleInvitation);
        };
    }, [user?._id, isSocketEnabled]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                notificationCount: notifications.length,
                clearNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error("useNotification must be used within NotificationProvider");
    }
    return ctx;
};
