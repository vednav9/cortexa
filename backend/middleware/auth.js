// middleware/auth.js
import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("🔐 Decoded JWT token:", decoded);

    // Ensure decoded token has necessary fields
    const userId = decoded.userId || decoded._id || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token structure - missing user ID",
      });
    }

    // Normalize the token data
    req.user = {
      _id: userId,
      id: userId,
      userId: userId,
      role: decoded.role,
      name: decoded.name || decoded.fullName,
      fullName: decoded.name || decoded.fullName,
      email: decoded.email,
    };

    console.log("✅ Authenticated user:", req.user);

    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
