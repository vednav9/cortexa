/**
 * Vercel serverless entry point.
 * Exports the Express app without calling server.listen().
 * MongoDB connection is cached across warm invocations.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../app.js";

dotenv.config();

// Cache the connection so Vercel reuses it across warm starts
let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected");
}

// Wrap every request: ensure DB is connected, then hand off to Express
const handler = async (req, res) => {
    await connectDB();
    return app(req, res);
};

export default handler;
