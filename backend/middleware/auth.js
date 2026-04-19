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

    // Ensure both _id and id are available for backward compatibility
    req.user = {
      ...decoded,
      _id: decoded._id || decoded.id,
      id: decoded.id || decoded._id,
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

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
};
