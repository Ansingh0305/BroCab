import React, { useState } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import './Auth.css';

const Login = ({ onSwitchToSignup, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle, createUserProfile } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
      console.error('Login error:', error);
      
      // Handle different Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          setErrors({ email: 'No account found with this email address' });
          break;
        case 'auth/wrong-password':
          setErrors({ password: 'Incorrect password' });
          break;
        case 'auth/invalid-email':
          setErrors({ email: 'Invalid email address' });
          break;
        case 'auth/too-many-requests':
          setErrors({ general: 'Too many failed attempts. Please try again later.' });
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
      console.log("Starting Google sign-in process...");
      const result = await signInWithGoogle();
      console.log("Google sign-in successful in component");
      
      // For Google sign-in, check if user profile exists, if not create one
      try {
        const userData = {
          name: result.user.displayName || result.user.email.split('@')[0],
          email: result.user.email,
          phone: result.user.phoneNumber || '' // Google might provide phone in some cases
          // Don't include gender field if not provided - let backend handle defaults
        };

        console.log("Creating/updating user profile for Google user:", userData.name);
        // Try to create user profile (it will fail silently if user already exists)
        await createUserProfile(userData, result);
        console.log("User profile operation completed");
      } catch (profileError) {
        // User profile might already exist, that's okay
        console.log('User profile creation skipped:', profileError.message);
      }
      
      onClose(); // Close modal on successful login
    } catch (error) {
      console.error('Google sign-in error in component:', error);
      
      // Enhanced error handling for Google sign-in
      if (error.message && error.message.includes('Invalid request data')) {
        setErrors({ general: 'Account setup failed. Please try signing up manually or contact support.' });
      } else {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            setErrors({ general: 'Sign-in was cancelled. Please try again.' });
            break;
          case 'auth/popup-blocked':
            setErrors({ 
              general: 'Popup was blocked by your browser. Please enable popups for this site and try again.' 
            });
            break;
          case 'auth/cancelled-popup-request':
            setErrors({ general: 'Another sign-in process is already in progress.' });
            break;
          case 'auth/network-request-failed':
            setErrors({ 
              general: 'Network error. Please check your internet connection and try again.' 
            });
            break;
          case 'auth/user-disabled':
            setErrors({ general: 'This account has been disabled. Please contact support.' });
            break;
          case 'auth/account-exists-with-different-credential':
            setErrors({ 
              general: 'An account already exists with the same email but different sign-in credentials.' 
            });
            break;
          case 'auth/operation-not-allowed':
            setErrors({ 
              general: 'Google sign-in is not enabled for this application. Please contact support.' 
            });
            break;
          case 'auth/timeout':
            setErrors({ general: 'Sign-in process timed out. Please try again.' });
            break;
          default:
            setErrors({ general: `Google sign-in failed: ${error.message}` });
        }
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
            className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
            required
          />
          {errors.email && <span className="auth-field-error">{errors.email}</span>}
        </div>

        <div className="auth-input-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
            required
          />
          {errors.password && <span className="auth-field-error">{errors.password}</span>}
        </div>

        <button 
          type="submit" 
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button 
        type="button" 
        className="auth-google-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <svg className="auth-google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="auth-switch">
        <p>
          Don't have an account?{' '}
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