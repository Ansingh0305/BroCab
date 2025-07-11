import React, { useState } from "react";
import { useAuth } from "../../firebase/AuthContext";
import "./Auth.css";

const Login = ({ onSwitchToSignup, onClose }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle, createUserProfile } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        const isNewUser =
          result.user.metadata.creationTime ===
          result.user.metadata.lastSignInTime;

        if (isNewUser) {
          const userDetails = {
            name: result.user.displayName,
            email: result.user.email,
          };
          await createUserProfile(userDetails, result);
        }
        onClose();
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrors({ general: "Google sign-in failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await login(formData.email, formData.password);
      onClose(); // Close modal on successful login
    } catch (error) {
      console.error("Login error:", error);

      // Handle different Firebase auth errors
      switch (error.code) {
        case "auth/user-not-found":
          setErrors({ email: "No account found with this email address" });
          break;
        case "auth/wrong-password":
          setErrors({ password: "Incorrect password" });
          break;
        case "auth/invalid-email":
          setErrors({ email: "Invalid email address" });
          break;
        case "auth/too-many-requests":
          setErrors({
            general: "Too many failed attempts. Please try again later.",
          });
          break;
        default:
          setErrors({ general: "Login failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2 className="auth-title">Welcome Back</h2>
      <p className="auth-subtitle">Sign in to your BroCab account</p>

      <form onSubmit={handleSubmit} className="auth-form-content">
        {errors.general && (
          <div className="auth-error-message">{errors.general}</div>
        )}

        <div className="auth-input-group">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
            required
          />
          {errors.email && (
            <span className="auth-field-error">{errors.email}</span>
          )}
        </div>

        <div className="auth-input-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`auth-input ${
              errors.password ? "auth-input-error" : ""
            }`}
            required
          />
          {errors.password && (
            <span className="auth-field-error">{errors.password}</span>
          )}
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="auth-separator">
        <span>OR</span>
      </div>

      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? "..." : "Sign in with Google"}
      </button>

      <div className="auth-switch">
        <p>
          Don't have an account?{" "}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={onSwitchToSignup}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;