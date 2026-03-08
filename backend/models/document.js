import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ["pdf", "docx", "txt", "pptx"],
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Institution",
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true
    },
    // Processing status mirrored from HF indexing workflow
    isProcessed: {
        type: Boolean,
        default: false
    },
    chunksCount: {
        type: Number,
        default: 0
    },
    processingError: String,
    // Stats
    downloadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
documentSchema.index({ institution: 1, course: 1 });
documentSchema.index({ uploadedBy: 1 });

export default mongoose.model("Document", documentSchema);
