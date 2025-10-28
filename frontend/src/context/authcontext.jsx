// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // prevent render until check done

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/student/check-auth", {
                    withCredentials: true,
                });
                if (res.data?.user) {
                    setUser(res.data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth check failed:", error.message);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return <div className="text-white text-center mt-10">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
