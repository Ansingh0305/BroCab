import React, { useState, useEffect } from "react";
import { MapPin, Calendar, Clock, Users, DollarSign, User, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../firebase/AuthContext";

const BrocabRouteBackground = () => (
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
      <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="30%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="route-gradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#bg-gradient)" />
    
    {/* Floating elements */}
    <circle cx="150" cy="200" r="120" fill="#8b5cf6" opacity="0.1" />
    <circle cx="1200" cy="150" r="180" fill="#a855f7" opacity="0.08" />
    <circle cx="300" cy="650" r="200" fill="#6366f1" opacity="0.12" />
    <circle cx="1100" cy="700" r="150" fill="#8b5cf6" opacity="0.1" />
    
    {/* Route path */}
    <path
      d="M100,450 Q400,350 800,400 T1300,450"
      stroke="url(#route-gradient)"
      strokeWidth="6"
      fill="none"
      strokeDasharray="20 15"
      strokeLinecap="round"
      opacity="0.4"
    />
    
    {/* Start point */}
    <g>
      <circle cx="100" cy="450" r="20" fill="#8b5cf6" opacity="0.9" />
      <circle cx="100" cy="450" r="8" fill="#fff" />
    </g>
    
    {/* End point */}
    <g>
      <circle cx="1300" cy="450" r="20" fill="#a855f7" opacity="0.9" />
      <circle cx="1300" cy="450" r="8" fill="#fff" />
    </g>
  </svg>
);

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  
  mainCard: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    maxWidth: "1024px",
  },
  
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(148, 163, 184, 0.5)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    overflow: "hidden",
  },
  
  header: {
    background: "linear-gradient(135deg,rgb(107, 37, 228) 0%, rgb(107, 37, 228) 50%, rgb(107, 37, 228) 100%)",
    padding: "48px 32px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  
  headerOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0, 0, 0, 0.1)",
  },
  
  headerContent: {
    position: "relative",
    zIndex: 10,
  },
  
  title: {
    fontSize: "3rem",
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: "16px",
    letterSpacing: "-0.025em",
  },
  
  subtitle: {
    fontSize: "1.25rem",
    color: "rgb(236, 236, 236)",
    fontWeight: "500",
    marginBottom: "8px",
  },
  
  description: {
    color: "rgba(196, 181, 253, 0.8)",
  },
  
  decorativeElement1: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "96px",
    height: "96px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    filter: "blur(40px)",
  },
  
  decorativeElement2: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    width: "128px",
    height: "128px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "50%",
    filter: "blur(60px)",
  },
  
  formContainer: {
    padding: "48px 32px",
  },
  
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "24px",
    marginBottom: "32px",
  },
  
  formGridMd: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
  
  fieldContainer: {
    position: "relative",
  },
  
  fieldContainerFull: {
    gridColumn: "1 / -1",
  },
  
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "12px",
  },
  
  labelIcon: {
    width: "16px",
    height: "16px",
    color: "#7c3aed",
  },
  
  inputWrapper: {
    position: "relative",
  },
  
  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "2px solid #e2e8f0",
    fontSize: "16px",
    color: "#334155",
    background: "rgba(248, 250, 252, 0.5)",
    backdropFilter: "blur(4px)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: 'inherit',
  },
  
  inputFocused: {
    borderColor: "#7c3aed",
    background: "#ffffff",
    boxShadow: "0 10px 15px -3px rgba(124, 58, 237, 0.1), 0 4px 6px -2px rgba(124, 58, 237, 0.05)",
    transform: "scale(1.01)",
  },
  
  inputFilled: {
    borderColor: "#cbd5e1",
    background: "#ffffff",
  },
  
  inputHover: {
    borderColor: "#cbd5e1",
  },
  
  inputDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  
  inputLoading: {
    opacity: 0.5,
  },
  
  focusIndicator: {
    position: "absolute",
    inset: 0,
    borderRadius: "16px",
    background: "rgba(124, 58, 237, 0.05)",
    pointerEvents: "none",
  },
  
  successMessage: {
    background: "linear-gradient(to right, #ecfdf5, #f0fdfa)",
    border: "2px solid #10b981",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
    animation: "slideInFromBottom 0.5s ease-out",
  },
  
  successIcon: {
    width: "32px",
    height: "32px",
    color: "#059669",
    flexShrink: 0,
  },
  
  successContent: {
    flex: 1,
  },
  
  successTitle: {
    fontWeight: "600",
    color: "#065f46",
    fontSize: "18px",
    marginBottom: "4px",
  },
  
  successText: {
    color: "#047857",
  },
  
  submitButton: {
    width: "100%",
    padding: "20px 32px",
    borderRadius: "16px",
    fontWeight: "bold",
    fontSize: "18px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    border: "none",
    cursor: "pointer",
    outline: "none",
    marginBottom: "32px",
  },
  
  submitButtonNormal: {
    background: "linear-gradient(to right, #7c3aed, #a855f7)",
    color: "#ffffff",
  },
  
  submitButtonHover: {
    background: "linear-gradient(to right, #6d28d9, #9333ea)",
    transform: "scale(1.02)",
    boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.25), 0 10px 10px -5px rgba(124, 58, 237, 0.04)",
  },
  
  submitButtonActive: {
    transform: "scale(0.98)",
  },
  
  submitButtonLoading: {
    background: "#cbd5e1",
    color: "#64748b",
    cursor: "not-allowed",
  },
  
  submitButtonSuccess: {
    background: "#10b981",
    color: "#ffffff",
    cursor: "default",
  },
  
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #64748b",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  
  buttonIcon: {
    width: "20px",
    height: "20px",
  },
  
  infoSection: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    paddingTop: "32px",
    borderTop: "1px solid #f1f5f9",
  },
  
  infoSectionMd: {
    gridTemplateColumns: "repeat(3, 1fr)",
  },
  
  infoCard: {
    textAlign: "center",
    padding: "16px",
    borderRadius: "12px",
  },
  
  infoCardViolet: {
    background: "#f3f4f6",
  },
  
  infoCardEmerald: {
    background: "#ecfdf5",
  },
  
  infoCardBlue: {
    background: "#eff6ff",
  },
  
  infoIcon: {
    width: "32px",
    height: "32px",
    margin: "0 auto 8px auto",
  },
  
  infoIconViolet: {
    color: "#7c3aed",
  },
  
  infoIconEmerald: {
    color: "#059669",
  },
  
  infoIconBlue: {
    color: "#2563eb",
  },
  
  infoTitle: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
  },
  
  infoText: {
    fontSize: "14px",
    color: "#64748b",
  },
  
  // Media queries simulation
  "@media (max-width: 768px)": {
    title: {
      fontSize: "2.5rem",
    },
    formContainer: {
      padding: "32px 24px",
    },
    header: {
      padding: "32px 24px",
    },
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(styleSheet);

const PostRidePage = ({ onSubmit }) => {
  const { currentUser, fetchUserDetails, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
    seats: "",
    seats_filled: 1,
    price: "",
  });

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState("");
  const [hoverStates, setHoverStates] = useState({});
  const [errors, setErrors] = useState({});
  const [rideDetails, setRideDetails] = useState(null); // To store ride details for the popup

  // Get API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.brocab.onrender.com';

  useEffect(() => {
    const fetchLeaderName = async () => {
      if (!currentUser) {
        alert("Please log in before posting a ride.");
        navigate("/login");
        return;
      }

      try {
        const userData = await fetchUserDetails();
        if (userData?.name) {
          setForm((prev) => ({ ...prev, leader: userData.name }));
        } else {
          alert("Please log in before posting a ride.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch leader name:", error);
        alert("An error occurred. Please log in again.");
        navigate("/login");
      }
    };

    fetchLeaderName();
  }, [currentUser, fetchUserDetails, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Ensure time is in 24-hour format
    if (name === "time") {
      const [hours, minutes] = value.split(":");
      const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
      setForm((prev) => ({ ...prev, [name]: formattedTime }));
    } else if (name === "seats") {
      // Convert seats to integer
      setForm((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else if (name === "price") {
      // Convert price to float
      setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0.0 }));
    } else if(name !== "leader") {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (success) setSuccess(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.leader) newErrors.leader = "Leader name is required.";
    if (!form.origin) newErrors.origin = "Pickup location is required.";
    if (!form.destination) newErrors.destination = "Destination is required.";
    if (!form.date) newErrors.date = "Travel date is required.";
    if (!form.time) newErrors.time = "Departure time is required.";
    if (!form.seats || form.seats < 1 || form.seats > 7) newErrors.seats = "Seats must be between 1 and 7.";
    if (!form.price || form.price <= 0) newErrors.price = "Price must be a positive number.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getIdToken();

      if (!token) {
        alert("Please log in before posting a ride.");
        navigate("/login");
        return;
      }

      const rideData = {
        origin: form.origin,
        destination: form.destination,
        date: form.date,
        time: form.time,
        seats: parseInt(form.seats),
        seats_filled: 1,
        price: parseFloat(form.price),
      };

      const response = await fetch(`${API_BASE_URL}/ride`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rideData),
      });

      if (!response.ok) {
        throw new Error("Failed to post ride.");
      }
      setRideDetails({
        origin: form.origin,
        destination: form.destination,
        date: form.date,
        seats: form.seats,
        price: form.price,
      });
      setSuccess(true);
      setLoading(false);
      if (onSubmit) onSubmit(form);
      setForm({
        origin: "",
        destination: "",
        date: "",
        time: "",
        seats: "",
        price: "",
      });
      // Do not navigate immediately; wait for user to close popup
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleMouseEnter = (key) => {
    setHoverStates(prev => ({ ...prev, [key]: true }));
  };

  const handleMouseLeave = (key) => {
    setHoverStates(prev => ({ ...prev, [key]: false }));
  };

  const inputFields = [
    { name: "leader", label: "Ride Leader", icon: User, type: "text", placeholder: "Your name", disabled: !!currentUser?.displayName, fullWidth: true },
    { name: "origin", label: "Pickup Location", icon: MapPin, type: "text", placeholder: "Enter pickup location" },
    { name: "destination", label: "Destination", icon: MapPin, type: "text", placeholder: "Enter destination" },
    { name: "date", label: "Travel Date", icon: Calendar, type: "date", placeholder: "" },
    { name: "time", label: "Departure Time", icon: Clock, type: "time", placeholder: "", step: "1" }, // Added step for 24-hour format
    { name: "seats", label: "Available Seats", icon: Users, type: "number", placeholder: "Number of seats", min: "1" , max: "7"},
    { name: "price", label: "Total Price (₹)", icon: DollarSign, type: "number", placeholder: "Total fare", min: "0" },
  ];

  const getInputStyle = (fieldName, disabled) => {
    const isActive = focusField === fieldName;
    const hasValue = form[fieldName];
    const isHovered = hoverStates[fieldName];
    
    let inputStyle = { ...styles.input };
    
    if (disabled) {
      inputStyle = { ...inputStyle, ...styles.inputDisabled };
    } else if (loading) {
      inputStyle = { ...inputStyle, ...styles.inputLoading };
    } else if (isActive) {
      inputStyle = { ...inputStyle, ...styles.inputFocused };
    } else if (hasValue) {
      inputStyle = { ...inputStyle, ...styles.inputFilled };
    } else if (isHovered) {
      inputStyle = { ...inputStyle, ...styles.inputHover };
    }
    
    return inputStyle;
  };

  const getButtonStyle = () => {
    let buttonStyle = { ...styles.submitButton };
    
    if (loading) {
      buttonStyle = { ...buttonStyle, ...styles.submitButtonLoading };
    } else if (success) {
      buttonStyle = { ...buttonStyle, ...styles.submitButtonSuccess };
    } else {
      buttonStyle = { ...buttonStyle, ...styles.submitButtonNormal };
      if (hoverStates.submitButton) {
        buttonStyle = { ...buttonStyle, ...styles.submitButtonHover };
      }
    }
    
    return buttonStyle;
  };

  // Responsive grid style
  const getGridStyle = () => {
    const baseStyle = { ...styles.formGrid };
    if (window.innerWidth >= 768) {
      return { ...baseStyle, ...styles.formGridMd };
    }
    return baseStyle;
  };

  const getInfoSectionStyle = () => {
    const baseStyle = { ...styles.infoSection };
    if (window.innerWidth >= 768) {
      return { ...baseStyle, ...styles.infoSectionMd };
    }
    return baseStyle;
  };

  return (
    <div style={styles.container}>
      <BrocabRouteBackground />
      
      <div style={styles.mainCard}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerOverlay}></div>
            <div style={styles.headerContent}>
              <h1 style={styles.title}>Post Your Route</h1>
              <p style={styles.subtitle}>Share your journey and find travel companions</p>
              <p style={styles.description}>Connect with fellow travelers and make your trip more enjoyable</p>
            </div>
            <div style={styles.decorativeElement1}></div>
            <div style={styles.decorativeElement2}></div>
          </div>
          {/* Form */}
          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit}>
              <div style={getGridStyle()}>
                {inputFields.map((field) => {
                  const Icon = field.icon;
                  const isActive = focusField === field.name;
                  
                  return (
                    <div 
                      key={field.name} 
                      style={{
                        ...styles.fieldContainer,
                        ...(field.fullWidth ? styles.fieldContainerFull : {})
                      }}
                    >
                      <label style={styles.label}>
                        <Icon style={styles.labelIcon} />
                        {field.label}
                      </label>
                      
                      <div style={styles.inputWrapper}>
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          min={field.min}
                          required
                          disabled={field.disabled || loading}
                          style={getInputStyle(field.name, field.disabled)}
                          onFocus={() => setFocusField(field.name)}
                          onBlur={() => setFocusField("")}
                          onMouseEnter={() => handleMouseEnter(field.name)}
                          onMouseLeave={() => handleMouseLeave(field.name)}
                        />
                        
                        {isActive && <div style={styles.focusIndicator}></div>}
                      </div>
                      {errors[field.name] && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors[field.name]}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Success Message */}
              {success && (
                <div style={styles.successMessage}>
                  <CheckCircle style={styles.successIcon} />
                  <div style={styles.successContent}>
                    <h3 style={styles.successTitle}>Ride Posted Successfully!</h3>
                    <p style={styles.successText}>Your ride is now live and others can request to join your journey.</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                style={getButtonStyle()}
                onMouseEnter={() => handleMouseEnter('submitButton')}
                onMouseLeave={() => handleMouseLeave('submitButton')}
              >
                {loading ? (
                  <>
                    <div style={styles.spinner}></div>
                    Posting Ride...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle style={styles.buttonIcon} />
                    Posted Successfully!
                  </>
                ) : (
                  <>
                    <MapPin style={styles.buttonIcon} />
                    Post My Ride
                  </>
                )}
              </button>
            </form>

            {/* Info Cards */}
            <div style={getInfoSectionStyle()}>
              <div style={{ ...styles.infoCard, ...styles.infoCardViolet }}>
                <Users style={{ ...styles.infoIcon, ...styles.infoIconViolet }} />
                <h4 style={styles.infoTitle}>Find Travel Buddies</h4>
                <p style={styles.infoText}>Connect with like-minded travelers</p>
              </div>
              <div style={{ ...styles.infoCard, ...styles.infoCardEmerald }}>
                <DollarSign style={{ ...styles.infoIcon, ...styles.infoIconEmerald }} />
                <h4 style={styles.infoTitle}>Share Costs</h4>
                <p style={styles.infoText}>Split fuel and toll expenses</p>
              </div>
              <div style={{ ...styles.infoCard, ...styles.infoCardBlue }}>
                <MapPin style={{ ...styles.infoIcon, ...styles.infoIconBlue }} />
                <h4 style={styles.infoTitle}>Safe Journey</h4>
                <p style={styles.infoText}>Travel with verified members</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ride Details Popup */}
      {rideDetails && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "30px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
            maxWidth: "500px",
            width: "90%",
          }}>
            <h2 style={{ color: "#4CAF50", marginBottom: "20px" }}>Ride Created Successfully!</h2>
            <p style={{ fontSize: "16px", marginBottom: "10px" }}><strong>From:</strong> {rideDetails.origin}</p>
            <p style={{ fontSize: "16px", marginBottom: "10px" }}><strong>To:</strong> {rideDetails.destination}</p>
            <p style={{ fontSize: "16px", marginBottom: "10px" }}><strong>Date:</strong> {rideDetails.date}</p>
            <p style={{ fontSize: "16px", marginBottom: "10px" }}><strong>Available Seats:</strong> {rideDetails.seats}</p>
            <p style={{ fontSize: "16px", marginBottom: "20px" }}><strong>Price:</strong> ₹{rideDetails.price}</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                setRideDetails(null);
                setSuccess(false);
                navigate("/my-booked-rides");
              }}
              style={{
                padding: "12px 24px",
                backgroundColor: "#4CAF50",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#45a049")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#4CAF50")}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostRidePage;