// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from "react";

const AuthContext = createContext();
const isBrowser = typeof window !== "undefined";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isBrowser);

  const trackLogout = () => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("set", { user_id: null });
    window.gtag("event", "logout");
  };

  useEffect(() => {
    if (!isBrowser) return;

    const token = localStorage.getItem("accessToken");
    const userRaw = localStorage.getItem("user");

    if (!token || !userRaw) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      setUser({ token, ...JSON.parse(userRaw) });
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const persistUser = (nextUser) => {
    if (!isBrowser) {
      setUser(nextUser || null);
      return;
    }

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
      if (!isBrowser) {
        return next;
      }
      const { token, ...userData } = next;
      if (token) {
        localStorage.setItem("accessToken", token);
      }
      localStorage.setItem("user", JSON.stringify(userData));
      return next;
    });
  };

  const logout = () => {
    trackLogout();
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, authLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
