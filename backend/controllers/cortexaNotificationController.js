import Notification from "../models/notification.js";
import { io } from "../server.js";

export const sendGlobalNotification = async (req, res) => {
    try {
        if (req.user.role !== "cortexa_admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Title and message are required",
            });
        }

        const notification = await Notification.create({
            title,
            message,
            senderRole: "cortexa_admin",
            isGlobal: true,
        });

        io.emit("global_notification", notification);

        res.status(201).json({
            success: true,
            notification,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to send notification" });
    }
};

// GET all notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};


