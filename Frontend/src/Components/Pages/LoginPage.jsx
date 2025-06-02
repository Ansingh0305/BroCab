import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/AuthContext';

// SVG Background matching your hero section
const BrocabHeroBackground = () => (
  <svg
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 0,
      pointerEvents: "none",
      minHeight: "100vh",
      minWidth: "100vw",
    }}
    viewBox="0 0 1440 900"
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="bg-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e2e4fa" />
        <stop offset="100%" stopColor="#c7f4f7" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#bg-gradient)" />
    {/* Soft circle accents */}
    <circle cx="220" cy="700" r="330" fill="#c7f4f7" opacity="0.45" />
    <circle cx="1300" cy="120" r="210" fill="#d1ccfc" opacity="0.28" />
    {/* Wavy white bottom */}
    <path
      d="M0,700 Q360,800 720,750 T1440,800 V900 H0 Z"
      fill="#fff"
      opacity="0.98"
    />
    {/* Dashed path */}
    <path
      d="M230,470 Q600,400 1200,650"
      stroke="#6f42c1"
      strokeWidth="13"
      fill="none"
      strokeDasharray="40 30"
      strokeLinecap="round"
    />
    {/* Start pin */}
    <g>
      <circle cx="230" cy="470" r="28" fill="#6f42c1" />
      <circle cx="230" cy="470" r="14" fill="#fff" />
    </g>
    {/* End pin */}
    <g>
      <circle cx="1200" cy="650" r="28" fill="#6f42c1" />
      <circle cx="1200" cy="650" r="14" fill="#fff" />
    </g>
  </svg>
);

const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
  mainCard: {
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '800px',
    display: 'flex',
    minHeight: '420px',
    flexDirection: 'row',
    zIndex: 1,
    margin: '10px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
  leftPanel: {
    flex: '1',
    padding: '36px 30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: 'white',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '35px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoDot: {
    width: '8px',
    height: '8px',
    background: '#667eea',
    borderRadius: '50%',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  createAccountLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  titleSection: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    color: '#666',
    fontSize: '15px',
    margin: '0',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'flex',
    alignSelf: "end",
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
    background: 'rgba(230, 230, 230, 0.9)',
  },
  forgotPassword: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  forgotPasswordLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    padding: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '15px',
  },
  backButton: {
    width: '100%',
    padding: '12px',
    background: '#e5e5e5',
    color: '#333',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  rightPanel: {
    flex: '1',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  rightPanelContent: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    margin: '20px',
    borderRadius: '20px',
    padding: '20px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: '70px',
    height: '70px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    color: '#1a1a1a',
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 10px 0',
  },
  featureText: {
    color: '#666',
    fontSize: '15px',
    margin: '0',
    lineHeight: '1.5',
  },
};

const CarIcon = () => (
  <svg width="35" height="35" fill="white" viewBox="0 0 24 24">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
  </svg>
);

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login, signInWithGoogle, createUserProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setErrors({ email: 'No account found with this email' });
          break;
        case 'auth/wrong-password':
          setErrors({ password: 'Incorrect password' });
          break;
        case 'auth/invalid-email':
          setErrors({ email: 'Invalid email address' });
          break;
        case 'auth/user-disabled':
          setErrors({ general: 'This account has been disabled' });
          break;
        case 'auth/too-many-requests':
          setErrors({ general: 'Too many failed attempts. Please try again later' });
          break;
        default:
          setErrors({ general: 'Login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});

    try {
      const result = await signInWithGoogle();
      
      // For existing users, Google sign-in should work directly
      // For new users, create user profile with available data
      const userData = {
        name: result.user.displayName || result.user.email.split('@')[0],
        email: result.user.email,
        phone: '', // Google doesn't provide phone by default
        gender: undefined
      };

      // Try to create user profile (will handle existing users gracefully)
      try {
        await createUserProfile(userData, result);
      } catch (profileError) {
        // If user already exists, that's fine - continue to dashboard
        console.log('User profile might already exist:', profileError);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle different Google auth errors
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
    <div>
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

      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div style={{ color: '#e53e3e', marginBottom: '15px', fontSize: '14px' }}>
            {errors.general}
          </div>
        )}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input 
            style={{
              ...styles.input,
              borderColor: errors.email ? '#e53e3e' : '#e5e5e5'
            }}
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required
            disabled={loading}
          />
          {errors.email && (
            <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '3px' }}>
              {errors.email}
            </div>
          )}
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input 
            style={{
              ...styles.input,
              borderColor: errors.password ? '#e53e3e' : '#e5e5e5'
            }}
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
            disabled={loading}
          />
          {errors.password && (
            <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '3px' }}>
              {errors.password}
            </div>
          )}
        </div>
        <div style={styles.forgotPassword}>
          <a href="#" style={styles.forgotPasswordLink} onClick={e => { e.preventDefault(); navigate('/forgot-password'); }}>
            Forgot your password?
          </a>
        </div>
        <button 
          type="submit" 
          style={{
            ...styles.loginButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [slideIn, setSlideIn] = React.useState(false);
  
  React.useEffect(() => {
    setTimeout(() => setSlideIn(true), 10);
  }, []);

  return (
    <div style={styles.container}>
      <BrocabHeroBackground />
      <div
        style={{
          ...styles.mainCard,
          transform: slideIn ? 'translateY(0)' : 'translateY(60px)',
          opacity: slideIn ? 1 : 0,
          transition: 'transform 0.5s cubic-bezier(.4,1.4,.6,1), opacity 0.5s',
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
              style={styles.createAccountLink} 
              onClick={e => { e.preventDefault(); navigate('/signup'); }}
            >
              Create an account
            </a>
          </div>
          <div style={styles.titleSection}>
            <h2 style={styles.title}>Welcome back</h2>
            <p style={styles.subtitle}>Log in to your account to continue</p>
          </div>
          <LoginForm />
          <button
            type="button"
            style={styles.backButton}
            onClick={() => navigate('/')}
            aria-label="Back to home"
          >
            Back
          </button>
        </div>
        <div style={styles.rightPanel}>
          <div style={styles.rightPanelContent}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>
                <CarIcon />
              </div>
              <h3 style={styles.featureTitle}>Reliable Rides</h3>
              <p style={styles.featureText}>
                Travel together with trusted students heading to the same destination. Save time, money, and the environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
