import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const cortexaAdminSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            default: "cortexa_admin",
        },
    },
    { timestamps: true }
);

cortexaAdminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

export default mongoose.model("CortexaAdmin", cortexaAdminSchema);
