import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true
    },
    embedding: {
        type: [Number], // Array of floats
        required: true
    },
    embeddingModel: {
        type: String,
        default: "paraphrase-MiniLM-L3-v2"
    },
    metadata: {
        institution_id: String,
        course_id: String,
        fileName: String,
        fileType: String,
        uploadedBy: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
documentChunkSchema.index({ document: 1, chunkIndex: 1 });
documentChunkSchema.index({ 'metadata.institution_id': 1, 'metadata.course_id': 1 });

export default mongoose.model("DocumentChunk", documentChunkSchema);
