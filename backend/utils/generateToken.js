import jwt from "jsonwebtoken";

export const generateToken = ({ id, role, name, email }) => {
    return jwt.sign(
        { 
            _id: id,  // Change from 'id' to '_id' for consistency
            id: id,   // Keep 'id' for backward compatibility
            role,
            name,
            email
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};
