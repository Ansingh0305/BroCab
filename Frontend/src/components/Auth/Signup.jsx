import React, { useState } from "react";
import { useAuth } from "../../firebase/AuthContext";
import "./Auth.css";

const Signup = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup, createUserProfile, signInWithGoogle } = useAuth();

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

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setErrors({});
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        // With Google Sign-In, we assume a new user should be created if they don't exist.
        // The createUserProfile function on the backend is idempotent, so it's safe to call.
        const userDetails = {
          name: result.user.displayName,
          email: result.user.email,
        };
        await createUserProfile(userDetails, result);
        onClose();
      }
    } catch (error) {
      console.error("Google sign-up error:", error);
      setErrors({ general: "Google sign-up failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Create Firebase user
      const userCredential = await signup(
        formData.email,
        formData.password,
        formData.name
      );

      // Create user profile in backend
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender || undefined,
      };

      await createUserProfile(userData);
      onClose(); // Close modal on successful signup
    } catch (error) {
      console.error("Signup error:", error);

      // Handle different Firebase auth errors
      switch (error.code) {
        case "auth/email-already-in-use":
          setErrors({ email: "An account with this email already exists" });
          break;
        case "auth/invalid-email":
          setErrors({ email: "Invalid email address" });
          break;
        case "auth/weak-password":
          setErrors({ password: "Password is too weak" });
          break;
        default:
          setErrors({ general: "Signup failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2 className="auth-title">Join BroCab</h2>
      <p className="auth-subtitle">Create your account to start sharing rides</p>

      <form onSubmit={handleSubmit} className="auth-form-content">
        {errors.general && <div className="auth-error-message">{errors.general}</div>}

        <div className="auth-input-group">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className={`auth-input ${errors.name ? "auth-input-error" : ""}`}
            required
          />
          {errors.name && <span className="auth-field-error">{errors.name}</span>}
        </div>

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
          {errors.email && <span className="auth-field-error">{errors.email}</span>}
        </div>

        <div className="auth-input-group">
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className={`auth-input ${errors.phone ? "auth-input-error" : ""}`}
            required
          />
          {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
        </div>

        <div className="auth-input-group">
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="auth-input auth-select"
          >
            <option value="">Select Gender (Optional)</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="auth-input-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`auth-input ${errors.password ? "auth-input-error" : ""}`}
            required
          />
          {errors.password && <span className="auth-field-error">{errors.password}</span>}
        </div>

        <div className="auth-input-group">
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`auth-input ${errors.confirmPassword ? "auth-input-error" : ""}`}
            required
          />
          {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="auth-separator">
        <span>OR</span>
      </div>

      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleSignUp}
        disabled={loading}
      >
        {loading ? "..." : "Sign up with Google"}
      </button>

      <div className="auth-switch">
        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={onSwitchToLogin}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;