import { createContext, useContext, useEffect, useState } from "react";
import { isRealtimeSocketEnabled, socket } from "../socket";
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
    // Real-time socket is disabled for unsupported targets (for example Vercel serverless).
    const isSocketEnabled = isRealtimeSocketEnabled;

    useEffect(() => {
        if (!user?._id) return;

        if (!isSocketEnabled) {
            console.info("[socket] Real-time disabled for current backend target (Socket.IO not supported).");
            return;
        }

        const handleConnect = () => {
            socket.emit("join:user", user._id);
            console.info("[socket] Connected", {
                socketId: socket.id,
                transport: socket.io.engine.transport.name,
                userId: user._id,
            });
        };

        const handleDisconnect = (reason) => {
            console.warn("[socket] Disconnected", { reason });
        };

        const handleConnectError = (error) => {
            console.error("[socket] Connection error", {
                message: error?.message,
                description: error?.description,
            });
        };

        const handleInvitation = (data) => {
            console.info("[socket] invitation:new received", data);
            addNotification(data);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("invitation:new", handleInvitation);

        if (!socket.connected) {
            socket.connect();
        } else {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
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
