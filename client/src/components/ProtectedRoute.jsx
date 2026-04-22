// src/components/ProtectedRoute.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login");
        }
    }, [authLoading, router, user]);

    if (authLoading) return null;
    if (!user) return null;

    return children;
}
