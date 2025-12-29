import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true },

    description: { type: String, default: "" },

    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: String,
    },

    contact: {
      email: String,
      phone: String,
      website: String,
    },

    branding: {
      logo: { type: String, default: "" },
      primaryColor: { type: String, default: "#10b981" },
    },

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Institution", institutionSchema);
