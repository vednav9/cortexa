import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    faculty: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for unique department per institution
departmentSchema.index({ institution: 1, code: 1 }, { unique: true });

export default mongoose.model("Department", departmentSchema);
