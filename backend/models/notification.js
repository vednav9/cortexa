import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },

        senderRole: {
            type: String,
            enum: ["cortexa_admin"],
            required: true,
        },

        isGlobal: { type: Boolean, default: true },

        readBy: [{ type: mongoose.Schema.Types.ObjectId }],
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
