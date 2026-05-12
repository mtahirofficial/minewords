// src/context/AuthContext.jsx
import { createContext, useCallback, useEffect, useState, useContext } from "react";
import api from "../api";

const AuthContext = createContext();
const isBrowser = typeof window !== "undefined";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isBrowser);

  const persistUser = useCallback((nextUser) => {
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
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!isBrowser) return false;

    const token = localStorage.getItem("accessToken");
    const userRaw = localStorage.getItem("user");

    if (!token || !userRaw) {
      persistUser(null);
      return false;
    }

    let storedUser = null;
    try {
      storedUser = JSON.parse(userRaw);
    } catch (error) {
      persistUser(null);
      return false;
    }

    // Hydrate immediately so UI doesn't flicker, then validate with /auth/me.
    setUser({ token, ...storedUser });

    try {
      const res = await api.get("/auth/me");
      const freshUser = res?.data?.data || null;
      if (!freshUser) {
        persistUser(null);
        return false;
      }
      persistUser({ token: localStorage.getItem("accessToken") || token, ...freshUser });
      return true;
    } catch (error) {
      // api.js will clear storage + navigate on hard auth failure; mirror state here.
      persistUser(null);
      return false;
    }
  }, [persistUser]);

  useEffect(() => {
    if (!isBrowser) return;

    let cancelled = false;

    const boot = async () => {
      setAuthLoading(true);
      await refreshAuth();
      if (!cancelled) setAuthLoading(false);
    };

    boot();

    const handleFocus = () => {
      refreshAuth();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshAuth]);

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
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, authLoading, login, logout, updateUser, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
