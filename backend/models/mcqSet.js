import mongoose from "mongoose";

const mcqSetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correctAnswer: {
            type: Number,
            required: true,
            min: 0,
            max: 3
        },
        explanation: String,
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium"
        }
    }],
    // Assignment settings
    isAssigned: {
        type: Boolean,
        default: false
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    dueDate: Date,
    duration: {
        type: Number, // in minutes
        default: 30
    },
    // Stats
    totalAttempts: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
mcqSetSchema.index({ institution: 1, course: 1 });
mcqSetSchema.index({ createdBy: 1 });
mcqSetSchema.index({ isAssigned: 1 });

export default mongoose.model("MCQSet", mcqSetSchema);
