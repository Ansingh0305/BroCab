// --- Real SignUpPage with working signup logic and form state ---
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../firebase/AuthContext";
import { getAuth } from 'firebase/auth';

import Navbar from '../Navbar/Navbar';



// --- Styles ---
const styles = {
  pageWrapper: {
    minHeight: "100vh",
    width: "100vw",
    position: "relative",
    overflow: "hidden",
    backgroundImage: 'url("/backgroundimg.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    minHeight: 'calc(100vh - 80px)',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
  mainCard: {
    background: "white",
    borderRadius: "24px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.18)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "800px",
    display: "flex",
    minHeight: "420px",
    flexDirection: "row",
    zIndex: 1,
  },
  leftPanel: {
    flex: "1",
    padding: "36px 30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "white",
    minWidth: "320px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "26px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoDot: {
    width: "9px",
    height: "9px",
    background: "#667eea",
    borderRadius: "50%",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  loginLink: {
    color: "#667eea",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "8px",
    padding: "4px 12px",
    transition: "background 0.2s",
  },
  loginLinkHover: {
    background: "#ede9fe",
  },
  titleSection: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 4px 0",
  },
  subtitle: {
    color: "#666",
    fontSize: "14px",
    margin: "0",
  },
  inputGroup: {
    marginBottom: "13px",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  input: (isError) => ({
    width: "100%",
    padding: "12px",
    border: `2px solid ${isError ? "#e53e3e" : "#e5e5e5"}`,
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    color: "#1e293b",
    boxSizing: "border-box",
    background: "#faf9ff",
    boxShadow: "0 4px 16px 0 rgba(124, 58, 237, 0.08)",
    transition:
      "background 0.3s, box-shadow 0.3s, border-color 0.3s, transform 0.3s",
  }),
  inputFocused: {
    borderColor: "#7c6ee6",
    boxShadow: "0 0 0 2px #e6e6fa",
    background: "#fff",
  },
  errorText: {
    color: "#e53e3e",
    fontSize: "12px",
    marginTop: "3px",
    marginLeft: "2px",
  },
  signupButton: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s, transform 0.1s",
    marginTop: "10px",
    boxShadow: "0 2px 8px 0 rgba(124, 58, 237, 0.08)",
  },
  signupButtonHover: {
    background: "linear-gradient(90deg, #764ba2 0%, #667eea 100%)",
    transform: "translateY(-2px) scale(1.03)",
  },
  rightPanel: {
    flex: "1",
    background:
      "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    minWidth: "260px",
  },
  rightPanelContent: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCard: {
    background: "rgba(255, 255, 255, 0.92)",
    borderRadius: "16px",
    padding: "26px 20px 18px 20px",
    textAlign: "center",
    boxShadow: "0 4px 16px 0 rgba(124, 58, 237, 0.08)",
    minWidth: "210px",
    maxWidth: "320px",
    margin: "0 auto",
  },
  featureIcon: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #a78bfa 0%, #7c6ee6 100%)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  featureTitle: {
    color: "#22223b",
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "7px",
    textAlign: "center",
  },
  featureText: {
    color: "#6b7280",
    fontSize: "13px",
    textAlign: "center",
    lineHeight: "1.5",
  },
};

const UserIcon = () => (
  <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" fill="#fff" />
    <rect x="4" y="16" width="16" height="6" rx="3" fill="#fff" />
  </svg>
);

// --- SignUpPage Component ---
const SignUpPage = () => {
  const navigate = useNavigate();
  const { signup, createUserProfile, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    password: ""
  });
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  React.useEffect(() => {
    setTimeout(() => setSlideIn(true), 10);
  }, []);

  // Refs for keyboard navigation
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const phoneRef = useRef(null);
  const genderRef = useRef(null);
  const [focused, setFocused] = useState("");
  const [touched, setTouched] = useState({});
  const [btnHover, setBtnHover] = useState(false);

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneNumber = formData.phone.replace(/\D/g, "");
      if (phoneNumber.length !== 10) {
        newErrors.phone = "Phone number must be 10 digits";
      } else if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        newErrors.phone = "Please enter a valid Indian mobile number";
      }
    }
    
    // Only validate password for non-Google auth
    if (!isGoogleAuth) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.gender) {
      newErrors.gender = "Please select your gender";
    }
    
    return newErrors;
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = async (e) => {
    setFocused("");
    setTouched({ ...touched, [e.target.name]: true });
    const field = e.target.name;
    const fieldError = validateForm({ ...formData, [field]: formData[field] });
    
    // Check email existence when email field is blurred
    if (field === 'email' && formData.email && !fieldError.email) {
      try {
        const response = await fetch(`https://brocab.onrender.com/api/v1/user/check-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: formData.email })
        });

        let data = null;
        if (response.headers.get('content-type')?.includes('application/json')) {
          try {
            data = await response.json();
          } catch (error) {
            console.error('Failed to parse response:', error);
          }
        }

        if (response.status === 409 || (data && data.exists)) {
          fieldError.email = "An account with this email already exists";
          setTouched(prev => ({ ...prev, email: true })); // Ensure error is shown
        }
      } catch (error) {
        console.error('Email check error:', error);
        fieldError.email = "Failed to verify email. Please try again.";
      }
    }
    
    setErrors({ ...errors, [field]: fieldError[field] });
  };

  const handleFocus = (field) => setFocused(field);

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      try {
        // First check if email exists
        const checkEmailResponse = await fetch(`https://brocab.onrender.com/api/v1/user/check-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: formData.email })
        });

        let emailData = null;
        if (checkEmailResponse.headers.get('content-type')?.includes('application/json')) {
          try {
            emailData = await checkEmailResponse.json();
          } catch (error) {
            console.error('Failed to parse email check response:', error);
          }
        }
        
        if (checkEmailResponse.status === 409 || (emailData && emailData.exists)) {
          setErrors({ email: "An account with this email already exists" });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Email check error:', error);
        setErrors({ general: "Failed to verify email. Please try again." });
        setLoading(false);
        return;
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender || undefined
      };

      if (isGoogleAuth) {
        // For Google auth, update profile
        await createUserProfile(userData);
        navigate("/dashboard");
      } else {
        // Regular email/password signup
        const userCredential = await signup(formData.email, formData.password, formData.name);
        await createUserProfile(userData, userCredential);
        navigate("/login");
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code) {
        // Firebase Auth errors
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
      } else {
        // API or other errors
        setErrors({ general: error.message || "Signup failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Handler

const handleGoogleSignIn = async () => {
  setLoading(true);
  setErrors({});
  const auth = getAuth();

  try {
    const result = await signInWithGoogle();
    const userEmail = result.user.email;

    // Check if email exists in backend
    try {
      const response = await fetch(`https://brocab.onrender.com/api/v1/user/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      });

      let data = null;
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      }

      if (response.status === 409 || (data && data.exists === true)) {
        // Clean up Firebase auth
        try {
          await result.user.delete();
        } catch {
          await auth.signOut();
        }

        setErrors({ general: "An account with this email already exists. Please log in instead." });
        navigate('/login');
        return;
      }
    } catch (error) {
      console.error('Email check error:', error);
      try {
        await result.user.delete();
      } catch {
        await auth.signOut();
      }
      setErrors({ general: "Failed to verify email. Please try again." });
      return;
    }

    // Email doesn't exist, prefill form
    setFormData(prev => ({
      ...prev,
      name: result.user.displayName || result.user.email.split('@')[0],
      email: result.user.email,
      password: '', // Don't store token
    }));

    setIsGoogleAuth(true);
    setTouched({
      name: true,
      email: true,
      phone: false,
      gender: false
    });
    phoneRef.current?.focus();

  } catch (error) {
    console.error('Google sign-in error:', error);
    try {
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
    } catch {
      await auth.signOut();
    }

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        setErrors({ general: 'Sign-in was cancelled' });
        break;
      case 'auth/popup-blocked':
        setErrors({ general: 'Popup was blocked. Please allow popups and try again.' });
        break;
      case 'auth/account-exists-with-different-credential':
        setErrors({ general: 'An account already exists with this email using a different sign-in method.' });
        break;
      default:
        setErrors({ general: 'Google sign-in failed. Please try again.' });
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={styles.pageWrapper}>
      <Navbar />
      <div style={styles.container}>
        <div
          style={{
            ...styles.mainCard,
            transform: slideIn ? "translateY(0)" : "translateY(60px)",
            opacity: slideIn ? 1 : 0,
            transition: "transform 0.5s cubic-bezier(.4,1.4,.6,1), opacity 0.5s",
          }}
        >
          <div style={styles.leftPanel}>
            <div style={styles.header}>
              <div style={styles.logo}>
                <div style={styles.logoDot}></div>
                <span style={styles.logoText}>Brocab</span>
              </div>
              <a
                href="#"
                style={styles.loginLink}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#ede9fe")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Log in
              </a>
            </div>
            <div style={styles.titleSection}>
              <h2 style={styles.title}>Create your account</h2>
              <p style={styles.subtitle}>Sign up to start sharing rides</p>
            </div>

            {/* Google Sign-In Button */}
            <button 
              type="button" 
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '20px',
                opacity: loading ? 0.7 : 1,
              }}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{
              position: 'relative',
              textAlign: 'center',
              margin: '20px 0',
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                background: '#e2e8f0',
              }}></div>
              <span style={{
                background: 'white',
                padding: '0 16px',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                position: 'relative',
              }}>or</span>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              {errors.general && (
                <div style={{ color: "#e53e3e", marginBottom: 8 }}>
                  {errors.general}
                </div>
              )}
              <div style={styles.inputGroup}>
                <input
                  ref={nameRef}
                  style={{
                    ...styles.input(errors.name),
                    ...(focused === "name" ? styles.inputFocused : {}),
                  }}
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => handleFocus("name")}
                  onBlur={handleBlur}
                  placeholder="Your name"
                  aria-invalid={!!errors.name}
                  aria-describedby="name-error"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      emailRef.current && emailRef.current.focus();
                    }
                  }}
                />
                {touched.name && errors.name && (
                  <div style={styles.errorText} id="name-error">
                    {errors.name}
                  </div>
                )}
              </div>
              <div style={styles.inputGroup}>
                <input
                  ref={emailRef}
                  style={{
                    ...styles.input(errors.email),
                    ...(focused === "email" ? styles.inputFocused : {}),
                  }}
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus("email")}
                  onBlur={handleBlur}
                  placeholder="Email address"
                  aria-invalid={!!errors.email}
                  aria-describedby="email-error"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      passwordRef.current && passwordRef.current.focus();
                    }
                  }}
                />
                {touched.email && errors.email && (
                  <div style={styles.errorText} id="email-error">
                    {errors.email}
                  </div>
                )}
              </div>
              <div style={styles.inputGroup}>
                <input
                  ref={passwordRef}
                  style={{
                    ...styles.input(errors.password),
                    ...(focused === "password" ? styles.inputFocused : {}),
                    opacity: isGoogleAuth ? 0.5 : 1,
                  }}
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => !isGoogleAuth && handleFocus("password")}
                  onBlur={handleBlur}
                  placeholder={isGoogleAuth ? "Password set by Google authentication" : "Password"}
                  minLength={6}
                  aria-invalid={!!errors.password}
                  aria-describedby="password-error"
                  autoComplete="new-password"
                  disabled={isGoogleAuth}
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      phoneRef.current && phoneRef.current.focus();
                    }
                  }}
                />
                {touched.password && errors.password && (
                  <div style={styles.errorText} id="password-error">
                    {errors.password}
                  </div>
                )}
              </div>
              <div style={styles.inputGroup}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      background: "#ede9fe",
                      color: "#667eea",
                      fontWeight: 600,
                      padding: "0 11px",
                      borderRadius: "6px 0 0 6px",
                      border: `2px solid ${errors.phone ? "#e53e3e" : "#e5e5e5"}`,
                      borderRight: "none",
                      height: "45px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "15px",
                      minWidth: "48px",
                      justifyContent: "center",
                    }}
                  >
                    +91
                  </span>
                  <input
                    ref={phoneRef}
                    style={{
                      ...styles.input(errors.phone),
                      borderRadius: "0 12px 12px 0",
                      borderLeft: "none",

                      flex: 1,
                      ...(focused === "phone" ? styles.inputFocused : {}),
                    }}
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => handleFocus("phone")}
                    onBlur={handleBlur}
                    required
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    placeholder="Phone number (10 digits)"
                    title="Enter a valid 10-digit Indian mobile number"
                    aria-invalid={!!errors.phone}
                    aria-describedby="phone-error"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        genderRef.current && genderRef.current.focus();
                      }
                    }}
                  />
                </div>
                {touched.phone && errors.phone && (
                  <div style={styles.errorText} id="phone-error">
                    {errors.phone}
                  </div>
                )}
              </div>
              <div style={styles.inputGroup}>
                <select
                  ref={genderRef}
                  style={{
                    ...styles.input(errors.gender),
                    ...(focused === "gender" ? styles.inputFocused : {}),
                  }}
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onFocus={() => handleFocus("gender")}
                  onBlur={handleBlur}
                  aria-invalid={!!errors.gender}
                  aria-describedby="gender-error"
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {touched.gender && errors.gender && (
                  <div style={styles.errorText} id="gender-error">
                    {errors.gender}
                  </div>
                )}
              </div>
              <button
                type="submit"
                style={{
                  ...styles.signupButton,
                  ...(btnHover ? styles.signupButtonHover : {}),
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                aria-label="Sign Up"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
              <button
                type="button"
                style={{
                  ...styles.signupButton,
                  background: "#e5e5e5",
                  color: "#333",
                  marginTop: 8,
                }}
                onClick={() => navigate("/")}
                aria-label="Back to Dashboard"
              >
                Back
              </button>
            </form>
          </div>
          <div style={styles.rightPanel}>
            <div style={styles.rightPanelContent}>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  <UserIcon />
                </div>
                <h3 style={styles.featureTitle}>Join the Community</h3>
                <p style={styles.featureText}>
                  Connect with fellow students, share costs, reduce your carbon
                  footprint, and make new friends on your journey...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;