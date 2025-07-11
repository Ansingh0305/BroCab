import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/AuthContext';
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

  // Function to check if user exists in backend API
  const checkUserExists = async (user) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('https://brocab.onrender.com/user', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const userCredential = await login(email, password);
      
      // Check if user profile exists in backend
      const userExists = await checkUserExists(userCredential.user);
      
      if (!userExists) {
        // User authenticated with Firebase but no profile exists
        setErrors({ 
          general: 'This email is not registered with us. Please sign up first to create an account.' 
        });
        // Sign out the user since they shouldn't be logged in
        await userCredential.user.auth.signOut();
        return;
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setErrors({ email: 'No account exists with this email. Please sign up first.' });
          break;
        case 'auth/wrong-password':
          setErrors({ password: 'Incorrect password. Please try again.' });
          break;
        case 'auth/invalid-email':
          setErrors({ email: 'Invalid email format. Please check and try again.' });
          break;
        case 'auth/user-disabled':
          setErrors({ general: 'This account has been disabled. Please contact support.' });
          break;
        case 'auth/too-many-requests':
          setErrors({ general: 'Too many failed attempts. Please try again later.' });
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          setErrors({ general: 'Invalid email or password. Please check your credentials or email does not exist.' });
          break;
        default:
          console.error('Unhandled login error:', error);
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
      const user = result.user;
      
      // Check if user profile exists in backend
      const userExists = await checkUserExists(user);
      
      if (!userExists) {
        // Check if the user is new
        const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

        if (isNewUser) {
          // Create user profile for new Google users
          const userDetails = {
            name: user.displayName || '',
            email: user.email || '',
            phone: '',
            gender: ''
          };
          await createUserProfile(userDetails, result);
        }
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
          setErrors({ general: 'Pop-up was blocked. Please allow pop-ups and try again.' });
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
          <div style={{ 
            color: '#e53e3e', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: 'rgba(229, 62, 62, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
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
    <div style={styles.pageWrapper}>
      <Navbar />
      <div style={styles.container}>
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
    </div>
  );
};

export default LoginPage;