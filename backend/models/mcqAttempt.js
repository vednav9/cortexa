import mongoose from "mongoose";

const mcqAttemptSchema = new mongoose.Schema({
    mcqSet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MCQSet",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    answers: [{
        questionIndex: Number,
        selectedAnswer: Number, // 0-3 for A-D
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    timeTaken: {
        type: Number, // in seconds
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
mcqAttemptSchema.index({ mcqSet: 1, student: 1 });
mcqAttemptSchema.index({ student: 1 });

export default mongoose.model("MCQAttempt", mcqAttemptSchema);
