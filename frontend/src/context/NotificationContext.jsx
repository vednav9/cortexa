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

    // 🔌 SOCKET LISTENER (THIS WAS MISSING)

    useEffect(() => {
        if (!user?._id) return;

        if (!socket.connected) {
            socket.connect();
            console.log("🟢 SOCKET CONNECTED:", socket.id);
        }

        socket.emit("join:user", user._id);
        console.log("👤 User joined room:", user._id);

        return () => {
            socket.disconnect();
            console.log("🔴 SOCKET DISCONNECTED");
        };
    }, [user?._id]);


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
