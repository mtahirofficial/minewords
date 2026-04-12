// src/context/AuthContext.jsx
import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem("accessToken");
        const userRaw = localStorage.getItem("user");

        if (!token || !userRaw) return null;

        try {
            return { token, ...JSON.parse(userRaw) };
        } catch (error) {
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            return null;
        }
    });

    const persistUser = (nextUser) => {
        if (!nextUser) {
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            setUser(null);
            return;
        }

        if (nextUser.token) {
            localStorage.setItem("accessToken", nextUser.token);
        }

        const { token, ...userData } = nextUser;
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(nextUser);
    };

    const login = (userData) => persistUser(userData);
    const updateUser = (partial = {}) => {
        setUser((prev) => {
            if (!prev) return prev;
            const keys = Object.keys(partial || {});
            const hasChanges = keys.some((key) => prev[key] !== partial[key]);
            if (!hasChanges) {
                return prev;
            }
            const next = { ...prev, ...partial };
            const { token, ...userData } = next;
            if (token) {
                localStorage.setItem("accessToken", token);
            }
            localStorage.setItem("user", JSON.stringify(userData));
            return next;
        });
    };

    const logout = () => {
        persistUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
