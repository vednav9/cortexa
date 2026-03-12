import mongoose from "mongoose";

const embeddingStoreSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true
    },
    chunkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DocumentChunk",
        required: true
    },
    text: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number], // Vector embedding as array
        required: true
    },
    embeddingDimension: {
        type: Number,
        default: 384 // paraphrase-MiniLM-L3-v2
    },
    embeddingModel: {
        type: String,
        default: "paraphrase-MiniLM-L3-v2"
    },
    metadata: {
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution"
        },
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        },
        fileName: String,
        fileType: String,
        chunkIndex: Number
    }
}, {
    timestamps: true
});

// Indexes for vector search and filtering
embeddingStoreSchema.index({ documentId: 1 });
embeddingStoreSchema.index({ chunkId: 1 });
embeddingStoreSchema.index({ 'metadata.institution_id': 1, 'metadata.course_id': 1 });

export default mongoose.model("EmbeddingStore", embeddingStoreSchema);
