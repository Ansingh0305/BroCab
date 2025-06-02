import React, { useState } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import './Auth.css';

const Signup = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup, signInWithGoogle, createUserProfile } = useAuth();

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const userCredential = await signup(formData.email, formData.password, formData.name);
      
      // Create user profile in backend
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender || undefined
      };

      await createUserProfile(userData);
      onClose(); // Close modal on successful signup
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle different Firebase auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrors({ email: 'An account with this email already exists' });
          break;
        case 'auth/invalid-email':
          setErrors({ email: 'Invalid email address' });
          break;
        case 'auth/weak-password':
          setErrors({ password: 'Password is too weak' });
          break;
        default:
          setErrors({ general: 'Signup failed. Please try again.' });
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
      
      // For Google sign-in, create user profile with Google data
      try {
        const userData = {
          name: result.user.displayName || result.user.email.split('@')[0],
          email: result.user.email,
          phone: '', // Google doesn't provide phone by default
          gender: undefined
        };

        // Try to create user profile (it will fail silently if user already exists)
        await createUserProfile(userData, result);
      } catch (profileError) {
        // User profile might already exist, that's okay
        console.log('User profile creation skipped (might already exist):', profileError);
      }
      
      onClose(); // Close modal on successful signup
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
        default:
          setErrors({ general: 'Google sign-in failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2 className="auth-title">Join BroCab</h2>
      <p className="auth-subtitle">Create your account to start sharing rides</p>
      
      <button 
        type="button" 
        className="auth-google-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{ marginBottom: '20px' }}
      >
        <svg className="auth-google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="auth-divider">
        <span>or</span>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form-content">
        {errors.general && (
          <div className="auth-error-message">{errors.general}</div>
        )}
        
        <div className="auth-input-group">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className={`auth-input ${errors.name ? 'auth-input-error' : ''}`}
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
            className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
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
            className={`auth-input ${errors.phone ? 'auth-input-error' : ''}`}
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
            className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
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
            className={`auth-input ${errors.confirmPassword ? 'auth-input-error' : ''}`}
            required
          />
          {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
        </div>

        <button 
          type="submit" 
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-switch">
        <p>
          Already have an account?{' '}
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