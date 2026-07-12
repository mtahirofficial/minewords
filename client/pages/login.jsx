import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import api from "../src/api";
import { useAuth } from "../src/context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const trackLogin = (user) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    if (!user?.id) {
      return;
    }

    window.gtag("set", { user_id: user.id });
    window.gtag("event", "login", { method: "password" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      const { accessToken, user } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      login({ ...user, token: accessToken });
      trackLogin(user);
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Login failed");
    }
    setIsSubmitting(false);
  };

  return (
    <main className="container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Login to access your account.</p>

        {submitError && <div className="error-message">{submitError}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="forgot-link">
          <Link href="/forgot">Forgot Password?</Link>
        </p>

        <p className="signup-link">
          Don't have an account? <Link href="/signup">Sign Up</Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
