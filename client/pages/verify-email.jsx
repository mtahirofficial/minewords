import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import api from "../src/api";
import { useAuth } from "../src/context/AuthContext";

const VerifyEmailPage = () => {
  const router = useRouter();
  const token = useMemo(() => {
    const rawToken = router.query.token;
    if (Array.isArray(rawToken)) return rawToken[0] || "";
    return rawToken || "";
  }, [router.query.token]);
  const { user, updateUser } = useAuth();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      if (!router.isReady) return;
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing from this link.");
        return;
      }

      try {
        const res = await api.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        const verifiedUser = res.data?.data?.user;

        if (user && verifiedUser?.email && user.email === verifiedUser.email) {
          updateUser({ isVerified: true });
        }

        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Could not verify email. Please request a new link.",
        );
      }
    };

    verify();
  }, [router.isReady, token, updateUser, user]);

  return (
    <main className="container">
      <div className="login-card" style={{ maxWidth: "620px" }}>
        <h2>Email Verification</h2>
        <p>{message}</p>

        {status === "loading" && <p>Please wait...</p>}

        {status === "success" && (
          <div className="success-message" style={{ marginTop: "12px" }}>
            Your account is verified. You can now create and interact with
            blogs.
          </div>
        )}

        {status === "error" && (
          <div className="error-message" style={{ marginTop: "12px" }}>
            Verification failed or the link expired.
          </div>
        )}

        <div style={{ marginTop: "16px" }}>
          <Link className="btn btn-primary" href={user ? "/dashboard" : "/login"}>
            {user ? "Go to Dashboard" : "Go to Login"}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default VerifyEmailPage;
