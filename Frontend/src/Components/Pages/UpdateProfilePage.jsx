import React, { useState, useEffect } from 'react';
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
    backdropFilter: 'blur(5px)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainCard: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "24px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "800px",
    display: "flex",
    minHeight: "420px",
    flexDirection: "row",
    zIndex: 1,
    backdropFilter: 'blur(10px)',
  },
  leftPanel: {
    flex: "1",
    padding: "36px 30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "rgba(255, 255, 255, 0.95)",
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
    border: `2px solid ${isError ? "#e53e3e" : "rgba(102, 126, 234, 0.3)"}`,
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    color: "#1e293b",
    boxSizing: "border-box",
    background: "#faf9ff",
    boxShadow: "0 4px 16px 0 rgba(124, 58, 237, 0.08)",
    transition: "all 0.3s ease",
    "&:focus": {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.2)",
    },
    "&:disabled": {
      background: "#f3f4f6",
      borderColor: "#e5e5e5",
      cursor: "not-allowed",
    }
  }),
  errorText: {
    color: "#e53e3e",
    fontSize: "12px",
    marginTop: "3px",
    marginLeft: "2px",
  },
  updateButton: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "10px",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  updateButtonHover: {
    background: "linear-gradient(90deg, #764ba2 0%, #667eea 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(102, 126, 234, 0.4)",
  },
  backButton: {
    width: '100%',
    padding: '12px',
    background: 'rgba(229, 229, 229, 0.9)',
    color: '#333',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '8px',
    '&:hover': {
      background: 'rgba(209, 209, 209, 0.9)',
      transform: 'translateY(-1px)',
    }
  },
  rightPanel: {
    flex: "1",
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    minWidth: "260px",
    backdropFilter: 'blur(5px)',
  },
  featureCard: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "16px",
    padding: "26px 20px 18px 20px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)",
    minWidth: "210px",
    maxWidth: "320px",
    margin: "0 auto",
    backdropFilter: 'blur(10px)',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
    }
  },
  successMessage: {
    color: "#2f855a",
    fontSize: "14px",
    marginTop: "10px",
    textAlign: "center",
  }
};

const UserIcon = () => (
  <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" fill="#fff" />
    <rect x="4" y="16" width="16" height="6" rx="3" fill="#fff" />
  </svg>
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://brocab.onrender.com';

// A helper function to get the current Firebase ID token
const getAuthHeaders = async (getIdToken) => {
  const token = await getIdToken();
  if (!token) throw new Error('No auth token available');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const UpdateProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, getIdToken } = useAuth();
  const [initialFormData, setInitialFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getDisabledStyle = () => ({
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderColor: '#e5e5e5',
    cursor: 'not-allowed'
  });

  const hasFormChanged = () => (
    formData.name !== initialFormData.name ||
    formData.phone !== initialFormData.phone ||
    formData.gender !== initialFormData.gender
  );

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders(getIdToken);
      
      // Fetch user data from backend first
      const response = await fetch(`${API_BASE_URL}/user`, { 
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Log each field separately to debug
      console.log('User profile fields:', {
        'name (API)': data.name,
        'email (API)': data.email,
        'phone (API)': data.phone,
        'gender (API)': data.gender,
        'name (Firebase)': currentUser?.displayName,
        'email (Firebase)': currentUser?.email
      });

      // Merge data with priority: API > Firebase > Empty string
      const newFormData = {
        name: data.name || currentUser?.displayName || "",
        email: data.email || currentUser?.email || "",
        phone: data.phone || "",  // Phone comes from API only
        gender: data.gender || "" // Gender comes from API only
      };

      console.log('Setting form data to:', newFormData);
      
      setFormData(newFormData);
      setInitialFormData(newFormData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrors({ 
        general: error.message || "Failed to load profile. Please check your connection and try again." 
      });
      
      // Fall back to Firebase data if API fails
      if (currentUser) {
        const fallbackData = {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          phone: "", // These fields only come from backend
          gender: ""
        };
        console.log('Using fallback data:', fallbackData);
        setFormData(fallbackData);
        setInitialFormData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => setSlideIn(true), 10);
    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.phone = "Please enter a valid Indian phone number (10 digits starting with 6-9)";
      }
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    setEditMode(false);
    setFormData(initialFormData);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setShowSuccess(false);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders(getIdToken);
      // Prepare update data, only send fields that have changed
      const updateData = {};
      if (formData.name !== initialFormData.name) updateData.name = formData.name;
      if (formData.phone !== initialFormData.phone) updateData.phone = formData.phone;
      if (formData.gender !== initialFormData.gender) updateData.gender = formData.gender;

      console.log('Sending update with data:', updateData);

      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
      }

      // Get the updated user data from response
      const updatedUser = await response.json();
      console.log('Profile update successful:', updatedUser);
      
      setEditMode(false);
      setShowSuccess(true);
      
      // Update form data with the response
      const newFormData = {
        ...formData,
        ...updatedUser
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
      setTimeout(() => setShowSuccess(false), 1000);
    } catch (error) {
      setErrors({ general: "Failed to update profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={styles.pageWrapper}>
        <Navbar />
        <div style={styles.container}>
          <div style={{...styles.mainCard, textAlign: 'center', padding: '2rem'}}>
            <h2>Please log in to update your profile</h2>
            <button 
              style={styles.updateButton} 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            </div>
            <div style={styles.titleSection}>
              <h2 style={styles.title}>Update Profile</h2>
              <p style={styles.subtitle}>Update your account information</p>
            </div>
            <form onSubmit={handleSubmit}>
              {showSuccess && (
                <div style={{
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  color: '#059669',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>✓</span>
                  Profile updated successfully!
                </div>
              )}
              {errors.general && (
                <div style={{ color: "#e53e3e", marginBottom: 8 }}>
                  {errors.general}
                </div>
              )}
              <div style={styles.inputGroup}>
                <input
                  style={{
                    ...styles.input(errors.name),
                    ...(!editMode ? getDisabledStyle() : { backgroundColor: '#faf9ff' })
                  }}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  disabled={!editMode}
                  aria-label="Name"
                />
                {errors.name && (
                  <div style={styles.errorText}>
                    {errors.name}
                  </div>
                )}
              </div>
              <div style={styles.inputGroup}>
                <input
                  style={{
                    ...styles.input(errors.email),
                    ...getDisabledStyle()
                  }}
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled={true}
                  placeholder="Email address"
                  aria-label="Email"
                />
              </div>
              <div style={styles.inputGroup}>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666',
                    fontSize: '15px'
                  }}>+91</span>
                  <input
                    style={{
                      ...styles.input(errors.phone),
                      ...(!editMode ? getDisabledStyle() : { backgroundColor: '#faf9ff' }),
                      paddingLeft: '45px'
                    }}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                    placeholder="Enter mobile number"
                    aria-label="Phone"
                  />
                </div>
                {errors.phone && (
                  <div style={styles.errorText}>
                    {errors.phone}
                  </div>
                )}
              </div>
              <div style={styles.inputGroup}>
                <select
                  style={{
                    ...styles.input(errors.gender),
                    ...(!editMode ? getDisabledStyle() : { backgroundColor: '#faf9ff' })
                  }}
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!editMode}
                  aria-label="Gender"
                >
                  <option value="">Select Gender (Optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {!editMode ? (
                <>
                  <button
                    type="button"
                    style={{
                      ...styles.updateButton,
                      ...(btnHover ? styles.updateButtonHover : {}),
                    }}
                    onMouseEnter={() => setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    style={{...styles.backButton, marginTop: '8px'}}
                    onClick={() => navigate("/dashboard")}
                  >
                    Back to Dashboard
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      ...styles.updateButton,
                      flex: 1,
                      marginTop: 0,
                      ...(btnHover ? styles.updateButtonHover : {}),
                      opacity: (loading || !hasFormChanged()) ? 0.7 : 1,
                      cursor: (loading || !hasFormChanged()) ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={() => setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                    disabled={loading || !hasFormChanged()}
                  >
                    {loading ? "Updating..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    style={{...styles.backButton, flex: 1, marginTop: 0}}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {showSuccess && (
                <div style={styles.successMessage}>
                  Profile updated successfully!
                </div>
              )}
            </form>
          </div>
          <div style={styles.rightPanel}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>
                <UserIcon />
              </div>
              <h3 style={styles.featureTitle}>Keep Your Profile Updated</h3>
              <p style={styles.featureText}>
                Keep your information current to make the most of BroCab's ride-sharing features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfilePage;
