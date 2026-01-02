import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    syllabus: {
      type: String,
      default: "",
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    maxCapacity: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for unique course per institution
courseSchema.index({ institution: 1, code: 1 }, { unique: true });

export default mongoose.model("Course", courseSchema);
