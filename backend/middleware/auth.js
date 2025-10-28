// middleware/auth.js
import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Attach user info to request
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};
