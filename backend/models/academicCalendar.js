import mongoose from "mongoose";

const academicCalendarSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    eventType: {
      type: String,
      enum: ["exam", "holiday", "event", "deadline", "other"],
      default: "event",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String,
      default: "",
    },
    targetAudience: {
      type: String,
      enum: ["all", "students", "faculty", "staff"],
      default: "all",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AcademicCalendar", academicCalendarSchema);
