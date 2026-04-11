// src/context/AuthContext.jsx
import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Initialize from localStorage if token exists
        const token = localStorage.getItem("accessToken");
        const user = localStorage.getItem("user");
        return token ? { token, ...JSON.parse(user) } : null;
    });

    const login = (userData) => setUser(userData);
    const logout = () => {
        localStorage.removeItem("accessToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
