import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import Navbar from '../Navbar/Navbar';
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
  },
  container: {
    minHeight: "calc(100vh - 80px)", // Account for navbar height
    width: "100vw",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  backgroundSVG: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 0,
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 2,
    background: "rgba(255,255,255,0.93)",
    backdropFilter: "blur(8px)",
    borderRadius: "22px",
    boxShadow: "0 8px 32px rgba(99,102,241,0.09)",
    padding: "38px 32px 32px 32px",
    minWidth: "320px",
    maxWidth: "380px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "bcDash-fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: "8px",
    textAlign: "center",
    letterSpacing: "-1px",
    textShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#475569",
    marginBottom: "26px",
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: "18px",
    position: "relative",
  },
  label: {
    fontWeight: 600,
    fontSize: "14px",
    color: "#1e293b",
    marginBottom: "7px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "16px 20px",
    borderRadius: "18px",
    fontSize: "16px",
    fontWeight: 500,
    background: "rgba(255,255,255,0.93)",
    backdropFilter: "blur(6px)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    outline: "none",
    border: "2px solid transparent",
    color: "#1e293b",
    transition: "background 0.3s, box-shadow 0.3s, border-color 0.3s, transform 0.3s",
  },
  inputFocused: {
    background: "#fff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    transform: "translateY(-2px)",
    borderColor: "#6366f1",
  },
  errorText: {
    color: "#e53e3e",
    fontSize: "13px",
    marginTop: "3px",
    marginLeft: "2px",
  },
  successText: {
    color: "#10b981",
    fontSize: "14px",
    marginTop: "10px",
    marginBottom: "10px",
    textAlign: "center",
    fontWeight: 600,
  },
  submitButton: {
    width: "100%",
    padding: "16px 0",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "white",
    border: "none",
    borderRadius: "18px",
    fontSize: "17px",
    fontWeight: 800,
    cursor: "pointer",
    marginTop: "8px",
    marginBottom: "10px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.22)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    transition: "background 0.3s, box-shadow 0.3s, transform 0.3s",
  },
  submitButtonHover: {
    background: "linear-gradient(135deg, #5856eb 0%, #7c3aed 100%)",
    transform: "translateY(-3px)",
    boxShadow: "0 8px 24px rgba(99, 102, 241, 0.33)",
  },
  loginLink: {
    color: "#6366f1",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "15px",
    marginTop: "12px",
    display: "block",
    textAlign: "center",
    transition: "color 0.2s",
  },
  loginLinkHover: {
    color: "#7c3aed",
  },
  bubbleContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    bottom: '-50px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    animation: 'float 8s infinite',
    pointerEvents: 'none',
  },
  '@keyframes float': {
    '0%': {
      transform: 'translateY(0)',
      opacity: 0,
    },
    '50%': {
      opacity: 0.8,
    },
    '100%': {
      transform: 'translateY(-100vh)',
      opacity: 0,
    }
  },

 };

const Bubbles = () => {
  const bubbleCount = 20;
  const bubbles = Array.from({ length: bubbleCount }).map((_, i) => {
    const size = Math.random() * 60 + 20;
    const left = Math.random() * 100;
    const animationDelay = Math.random() * 8;
    const animationDuration = Math.random() * 4 + 6;

    return (
      <div
        key={i}
        style={{
          ...styles.bubble,
          width: size + 'px',
          height: size + 'px',
          left: left + '%',
          animationDelay: animationDelay + 's',
          animationDuration: animationDuration + 's',
        }}
      />
    );
  });

  return <div style={styles.bubbleContainer}>{bubbles}</div>;
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [loginHover, setLoginHover] = useState(false);

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      setSent(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setError("");
      setSent(true);
    } catch (err) {
      console.error("Reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError("Something went wrong. Please try again later.");
      }
      setSent(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar />
      <div style={styles.container}>
        <Bubbles />
        <form style={styles.card} onSubmit={handleSubmit} autoComplete="off">
          <div style={styles.title}>Forgot Password?</div>
          <div style={styles.subtitle}>
            Enter your email and we'll send you a reset link.
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              style={{
                ...styles.input,
                ...(focused ? styles.inputFocused : {}),
                borderColor: error ? "#e53e3e" : (focused ? "#6366f1" : "transparent"),
              }}
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); setSent(false); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="you@example.com"
              aria-invalid={!!error}
              aria-describedby="forgot-error"
            />
            {error && <div style={styles.errorText} id="forgot-error">{error}</div>}
          </div>
          {sent && (
            <div style={styles.successText}>
              ✅ If an account exists for this email, a reset link has been sent.
            </div>
          )}
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(btnHover ? styles.submitButtonHover : {}),
            }}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            Send Reset Link
          </button>
          <a
            href="/login"
            style={{
              ...styles.loginLink,
              ...(loginHover ? styles.loginLinkHover : {}),
            }}
            onMouseEnter={() => setLoginHover(true)}
            onMouseLeave={() => setLoginHover(false)}
          >
            Back to Login
          </a>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
