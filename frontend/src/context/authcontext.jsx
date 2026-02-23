import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Read cached user from localStorage for instant startup
const getCachedUser = () => {
    try {
        const raw = localStorage.getItem("auth_user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const cached = getCachedUser();
    const [user, setUserState] = useState(cached);
    // If we have a cached user, skip the loading screen entirely
    const [loading, setLoading] = useState(!cached);

    const setUser = (u) => {
        setUserState(u);
        if (u) {
            localStorage.setItem("auth_user", JSON.stringify(u));
        } else {
            localStorage.removeItem("auth_user");
        }
    };

    const refreshUser = async () => {
        try {
            const { data } = await axios.get(
                "http://localhost:5000/api/auth/me",
                { withCredentials: true }
            );
            setUser(data.user);
        } catch (err) {
            console.error("Failed to refresh user", err);
        }
    };

    useEffect(() => {
        // Silent background validation — don't block UI
        axios
            .get("http://localhost:5000/api/auth/me", { withCredentials: true })
            .then(res => {
                setUser(res.data.user);
            })
            .catch(() => {
                // Server rejected session — clear cached state
                setUserState(null);
                localStorage.removeItem("auth_user");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
