// SignupPage.jsx
import React, { useState } from "react";
import api from "../api";
import { showToast } from "../toast";
import { Link, useNavigate } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("")
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      console.log(formData);
      const res = await api.post("/auth/register", { user: formData });
      console.log(res);

      if (res.data.status === 200) {
        setSubmitSuccess("Account created. Please check your email to verify your account.");
        setFormData({ name: "", email: "", username: "", password: "" });
        navigate("/login");
        showToast("Account created. Verification link sent to your email.", "success");
      } else {
        setSubmitError("Failed to create account.");
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container">
      <div className="signup-card">
        <h2>Create Your Account</h2>
        <p>Sign up to join our community and get started.</p>

        {submitSuccess && <div className="success-message">Account created successfully!</div>}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your full name"
              required
            />
          </div>

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
              placeholder="Enter a strong password"
              required
            />
          </div>

          <button className="btn btn-success" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
};

export default SignupPage;
