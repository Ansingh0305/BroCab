import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../firebase/AuthContext';
import Navbar from '../Navbar/Navbar';
import './PostRide.css';

const BACKGROUND_IMAGE = '/backgroundimg.png';

// Debounce function for API calls
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const PostRide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, fetchUserDetails, getIdToken } = useAuth();
  const postFormRef = useRef();

  // Get initial data from dashboard if available
  const initialData = location.state || {};

  const [formData, setFormData] = useState({
    pickup: initialData.pickup || '',
    destination: initialData.destination || '',
    date: initialData.date || '',
    time: initialData.time || '',
    seats: initialData.seats || 1,
    price: initialData.price || '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  // Location suggestions state
  const [suggestions, setSuggestions] = useState({
    pickup: [],
    destination: []
  });
  const [showSuggestions, setShowSuggestions] = useState({
    pickup: false,
    destination: false
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState({
    pickup: false,
    destination: false
  });

  // Involvement check state
  const [dateInvolvement, setDateInvolvement] = useState({
    checked: false,
    hasRide: false,
    loading: false,
    error: '',
    cleared: false,
    autoPost: false
  });

  useEffect(() => {
    const fetchUserName = async () => {
      if (!currentUser) {
        alert("Please log in before posting a ride.");
        navigate("/login");
        return;
      }

      try {
        const userData = await fetchUserDetails();
        if (userData?.name) {
          setUserName(userData.name);
        } else {
          alert("Please complete your profile before posting a ride.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        alert("An error occurred. Please log in again.");
        navigate("/login");
      }
    };

    fetchUserName();
  }, [currentUser, fetchUserDetails, navigate]);

  // BEST FREE API - Photon (Ultra Precise)
  const getPhotonLocations = async (query) => {
    if (query.length < 2) return [];
    try {
      // Photon API with Indian coordinates for better results
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en&lon=77.2090&lat=28.6139&zoom=12`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.features.map(feature => {
        const props = feature.properties;
        let displayName = '';
        if (props.name) displayName += props.name;
        if (props.street && props.street !== props.name) displayName += displayName ? `, ${props.street}` : props.street;
        if (props.city && props.city !== props.name) displayName += displayName ? `, ${props.city}` : props.city;
        if (props.state) displayName += displayName ? `, ${props.state}` : props.state;
        if (props.country) displayName += displayName ? `, ${props.country}` : props.country;
        return {
          display_name: displayName || 'Unknown Location',
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
          type: props.type || 'place',
          osm_id: props.osm_id,
          source: 'photon'
        };
      }).filter(location => location.display_name !== 'Unknown Location');
    } catch (error) {
      // Fallback to Nominatim if Photon fails
      try {
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`
        );
        const fallbackData = await fallbackResponse.json();
        return fallbackData.map(item => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || 'place',
          place_id: item.place_id,
          source: 'nominatim'
        }));
      } catch (fallbackError) {
        return [];
      }
    }
  };

  const debouncedLocationSearch = useCallback(
    debounce(async (query, fieldName) => {
      if (query.length > 1) {
        setLoadingSuggestions(prev => ({
          ...prev,
          [fieldName]: true
        }));
        const locationSuggestions = await getPhotonLocations(query);
        setSuggestions(prev => ({
          ...prev,
          [fieldName]: locationSuggestions
        }));
        setShowSuggestions(prev => ({
          ...prev,
          [fieldName]: true
        }));
        setLoadingSuggestions(prev => ({
          ...prev,
          [fieldName]: false
        }));
      } else {
        setShowSuggestions(prev => ({
          ...prev,
          [fieldName]: false
        }));
      }
    }, 250),
    []
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Trigger location search for pickup and destination
    if (name === 'pickup' || name === 'destination') {
      debouncedLocationSearch(value, name);
    }
    if (error) setError('');
    if (success) setSuccess(false);
    // If date is changed, reset involvement check
    if (name === 'date') {
      setDateInvolvement({
        checked: false,
        hasRide: false,
        loading: false,
        error: '',
        cleared: false,
        autoPost: false
      });
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: suggestion.display_name
    }));
    setShowSuggestions(prev => ({
      ...prev,
      [fieldName]: false
    }));
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions({ pickup: false, destination: false });
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Check involvement on date change
  useEffect(() => {
    if (!formData.date) return;
    setDateInvolvement(prev => ({ ...prev, checked: false, loading: true, error: '', cleared: false, autoPost: false }));
    const check = async () => {
      try {
        const token = await getIdToken();
        const resp = await fetch(`https://brocab.onrender.com/user/check-involvement/${formData.date}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error('Failed to check ride involvement');
        const data = await resp.json();
        // API returns { involved: true/false }
        setDateInvolvement({
          checked: true,
          hasRide: data.involved === true,
          loading: false,
          error: '',
          cleared: false,
          autoPost: false
        });
      } catch (err) {
        setDateInvolvement({
          checked: true,
          hasRide: false,
          loading: false,
          error: 'Could not check ride status',
          cleared: false,
          autoPost: false
        });
      }
    };
    check();
    // eslint-disable-next-line
  }, [formData.date, getIdToken]);

  // Handler for clearing all rides on that date
  const handleClearInvolvement = async () => {
    setDateInvolvement(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const token = await getIdToken();
      const resp = await fetch(`https://brocab.onrender.com/user/clear-involvement/${formData.date}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to clear rides for this date');
      setDateInvolvement(prev => ({ ...prev, hasRide: false, cleared: true, loading: false, autoPost: true }));
    } catch (err) {
      setDateInvolvement(prev => ({ ...prev, loading: false, error: 'Could not clear rides. Try again.' }));
    }
  };

  // Auto-post the ride after clearing involvement
  useEffect(() => {
    if (dateInvolvement.autoPost && postFormRef.current) {
      postFormRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      setDateInvolvement(prev => ({ ...prev, autoPost: false }));
    }
  }, [dateInvolvement.autoPost]);

  const validateForm = () => {
    if (!formData.pickup.trim()) {
      setError('Please enter pickup location');
      return false;
    }
    if (!formData.destination.trim()) {
      setError('Please enter destination');
      return false;
    }
    if (!formData.date) {
      setError('Please select travel date');
      return false;
    }
    if (!formData.time) {
      setError('Please select departure time');
      return false;
    }
    if (!formData.seats || formData.seats < 1 || formData.seats > 7) {
      setError('Please select valid number of seats (1-7)');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter valid price');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must log in before posting a ride.");
      navigate("/login");
      return;
    }

    if (!validateForm()) {
      return;
    }

    // If involvement is checked and hasRide, do not submit
    if (dateInvolvement.checked && dateInvolvement.hasRide && !dateInvolvement.cleared) {
      setError('You already have a ride on this date. Please clear it first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getIdToken();

      const rideData = {
        origin: formData.pickup.trim(),
        destination: formData.destination.trim(),
        date: formData.date,
        time: formData.time,
        seats: parseInt(formData.seats, 10),
        seats_filled: 0,
        price: parseFloat(formData.price),
        description: formData.description.trim() || `Ride from ${formData.pickup} to ${formData.destination}`
      };

      const response = await fetch("https://brocab.onrender.com/ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(rideData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post the ride because there is already a ride scheduled for the same day.");
      }

      const result = await response.json();
      setSuccess(true);

      // Reset form
      setFormData({
        pickup: '',
        destination: '',
        date: '',
        time: '',
        seats: 1,
        price: '',
        description: ''
      });

      // Show success for 2 seconds then navigate
      setTimeout(() => {
        navigate('/my-rides');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to post ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!currentUser) {
    return (
      <div className="bcPostRide-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcPostRide-main-content">
          <div className="bcPostRide-error">
            <h2>Authentication Required</h2>
            <p>Please login to post a ride.</p>
            <button onClick={() => navigate('/login')} className="bcPostRide-back-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bcPostRide-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <Navbar />

      <div className="bcPostRide-main-content">
        <div className="bcPostRide-header">
          <h1 className="bcPostRide-title">Post Your Ride</h1>
          <p className="bcPostRide-subtitle">
            Share your journey and find travel buddies! 🚗💜
          </p>
        </div>

        <div className="bcPostRide-content-wrapper">
          <div className="bcPostRide-form-section">
            <div className="bcPostRide-form-container">
              <div className="bcPostRide-form-header">
                <h2>Ride Details</h2>
                <p>Fill in your ride information to find passengers</p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="bcPostRide-success-message">
                  <span className="bcPostRide-success-icon">✅</span>
                  <div>
                    <h3>Ride Posted Successfully!</h3>
                    <p>Your ride is now live! Redirecting to My Rides...</p>
                  </div>
                </div>
              )}


              {/* Involvement warning and clear option */}
              {dateInvolvement.checked && dateInvolvement.hasRide && !dateInvolvement.cleared && (
                <div className="bcPostRide-error-message" style={{ background: '#fffbe9', color: '#b45309' }}>
                  <span>⚠️</span>
                  <div>
                    <strong>You already have a ride (posted or joined) on {formData.date}.</strong>
                    <br />
                    <button
                      type="button"
                      className="bcPostRide-back-btn"
                      style={{ background: '#f59e0b', color: '#fff', marginTop: 8 }}
                      onClick={handleClearInvolvement}
                      disabled={dateInvolvement.loading}
                    >
                      {dateInvolvement.loading ? 'Clearing...' : 'Clear All Rides on This Day'}
                    </button>
                  </div>
                </div>
              )}
              {dateInvolvement.cleared && (
                <div className="bcPostRide-success-message">
                  <span>✅</span>
                  All rides on {formData.date} cleared! Posting your ride...
                </div>
              )}

              <form onSubmit={handleSubmit} className="bcPostRide-form" ref={postFormRef}>
                {/* Leader Info */}
                <div className="bcPostRide-leader-info">
                  <div className="bcPostRide-leader-avatar">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="bcPostRide-leader-label">Ride Leader</span>
                    <span className="bcPostRide-leader-name">{userName || 'Loading...'}</span>
                  </div>
                </div>

                {/* Route Section with Autocomplete */}
                <div className="bcPostRide-section">
                  <h3 className="bcPostRide-section-title">📍 Route Information</h3>
                  <div className="bcPostRide-form-row">
                    {/* Pickup Location with Autocomplete */}
                    <div className="bcPostRide-input-group" onClick={(e) => e.stopPropagation()}>
                      <label className="bcPostRide-label">Pickup Location *</label>
                      <div className="bcPostRide-input-wrapper">
                        <div className="bcPostRide-location-dot bcPostRide-pickup-dot"></div>
                        <input
                          type="text"
                          name="pickup"
                          value={formData.pickup}
                          onChange={handleInputChange}
                          placeholder="Enter pickup location"
                          className="bcPostRide-input"
                          autoComplete="off"
                          required
                          disabled={loading}
                        />
                        {/* Loading indicator */}
                        {loadingSuggestions.pickup && (
                          <div className="bcPostRide-suggestions-loading">
                            <div className="bcPostRide-loading-spinner"></div>
                            <span>Searching...</span>
                          </div>
                        )}
                        {/* Pickup Suggestions */}
                        {showSuggestions.pickup && suggestions.pickup.length > 0 && !loadingSuggestions.pickup && (
                          <div className="bcPostRide-suggestions-dropdown">
                            {suggestions.pickup.map((suggestion, index) => (
                              <div 
                                key={suggestion.osm_id || suggestion.place_id || index}
                                className="bcPostRide-suggestion-item"
                                onClick={() => handleSuggestionSelect(suggestion, 'pickup')}
                              >
                                <div className="bcPostRide-suggestion-icon">📍</div>
                                <div className="bcPostRide-suggestion-content">
                                  <div className="bcPostRide-suggestion-text">
                                    {suggestion.display_name}
                                  </div>
                                  <div className="bcPostRide-suggestion-type">
                                    {suggestion.type} • {suggestion.source}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Destination with Autocomplete */}
                    <div className="bcPostRide-input-group" onClick={(e) => e.stopPropagation()}>
                      <label className="bcPostRide-label">Destination *</label>
                      <div className="bcPostRide-input-wrapper">
                        <div className="bcPostRide-location-dot bcPostRide-destination-dot"></div>
                        <input
                          type="text"
                          name="destination"
                          value={formData.destination}
                          onChange={handleInputChange}
                          placeholder="Enter destination"
                          className="bcPostRide-input"
                          autoComplete="off"
                          required
                          disabled={loading}
                        />
                        {/* Loading indicator */}
                        {loadingSuggestions.destination && (
                          <div className="bcPostRide-suggestions-loading">
                            <div className="bcPostRide-loading-spinner"></div>
                            <span>Searching...</span>
                          </div>
                        )}
                        {/* Destination Suggestions */}
                        {showSuggestions.destination && suggestions.destination.length > 0 && !loadingSuggestions.destination && (
                          <div className="bcPostRide-suggestions-dropdown">
                            {suggestions.destination.map((suggestion, index) => (
                              <div 
                                key={suggestion.osm_id || suggestion.place_id || index}
                                className="bcPostRide-suggestion-item"
                                onClick={() => handleSuggestionSelect(suggestion, 'destination')}
                              >
                                <div className="bcPostRide-suggestion-icon">🎯</div>
                                <div className="bcPostRide-suggestion-content">
                                  <div className="bcPostRide-suggestion-text">
                                    {suggestion.display_name}
                                  </div>
                                  <div className="bcPostRide-suggestion-type">
                                    {suggestion.type} • {suggestion.source}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time Section */}
                <div className="bcPostRide-section">
                  <h3 className="bcPostRide-section-title">🕐 Schedule</h3>
                  <div className="bcPostRide-form-row">
                    <div className="bcPostRide-input-group">
                      <label className="bcPostRide-label">Travel Date *</label>
                      <div className="bcPostRide-input-wrapper">
                        <div className="bcPostRide-date-dot"></div>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="bcPostRide-input bcPostRide-date-input"
                          min={new Date().toISOString().split('T')[0]}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="bcPostRide-input-group">
                      <label className="bcPostRide-label">Departure Time *</label>
                      <div className="bcPostRide-input-wrapper">
                        <div className="bcPostRide-time-dot"></div>
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          className="bcPostRide-input bcPostRide-time-input"
                          step="60"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capacity & Price Section */}
                <div className="bcPostRide-section">
                  <h3 className="bcPostRide-section-title">💰 Pricing & Capacity</h3>
                  <div className="bcPostRide-form-row">
                    <div className="bcPostRide-input-group">
                      <label className="bcPostRide-label">Available Seats *</label>
                      <div className="bcPostRide-input-wrapper">
                        <div className="bcPostRide-seats-dot"></div>
                        <select
                          name="seats"
                          value={formData.seats}
                          onChange={handleInputChange}
                          className="bcPostRide-select"
                          required
                          disabled={loading}
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map(num => (
                            <option key={num} value={num}>
                              {num} seat{num > 1 ? 's' : ''} available
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="bcPostRide-input-group">
                      <label className="bcPostRide-label">Price per Person (₹) *</label>
                      <div className="bcPostRide-input-wrapper">
                        <div className="bcPostRide-price-dot"></div>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="Enter price"
                          className="bcPostRide-input"
                          min="1"
                          step="0.01"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div className="bcPostRide-section">
                  <h3 className="bcPostRide-section-title">📝 Additional Details</h3>
                  <div className="bcPostRide-input-group">
                    <label className="bcPostRide-label">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Add any additional information about your ride (vehicle type, stops, preferences, etc.)"
                      className="bcPostRide-textarea"
                      rows="4"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bcPostRide-actions">
                  <button
                    type="button"
                    onClick={handleBackToDashboard}
                    className="bcPostRide-back-btn"
                    disabled={loading}
                  >
                    Back to Dashboard
                  </button>
                  <button
                    type="submit"
                    className="bcPostRide-submit-btn"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <>
                        <span className="bcPostRide-spinner"></span>
                        Posting Ride...
                      </>
                    ) : success ? (
                      <>
                        ✅ Posted Successfully!
                      </>
                    ) : (
                      <>
                        🚀 Post My Ride
                      </>
                    )}
                  </button>
                </div>
                {error && (
                <div className="bcPostRide-error-message">
                  <span className="bcPostRide-error-icon">❌</span>
                  <p>{error}</p>
                </div>
              )}

              </form>
            </div>
          </div>

          {/* Info Section */}
          <div className="bcPostRide-info-section">
            <div className="bcPostRide-info-container">
              <h3 className="bcPostRide-info-title">Why Post with BroCab?</h3>
              <div className="bcPostRide-info-cards">
                <div className="bcPostRide-info-card">
                  <div className="bcPostRide-info-icon">💰</div>
                  <h4>Share Costs</h4>
                  <p>Split fuel and toll expenses with fellow travelers</p>
                </div>
                <div className="bcPostRide-info-card">
                  <div className="bcPostRide-info-icon">🤝</div>
                  <h4>Meet People</h4>
                  <p>Connect with like-minded travelers and make new friends</p>
                </div>
                <div className="bcPostRide-info-card">
                  <div className="bcPostRide-info-icon">🌍</div>
                  <h4>Help Environment</h4>
                  <p>Reduce carbon footprint by sharing rides</p>
                </div>
                <div className="bcPostRide-info-card">
                  <div className="bcPostRide-info-icon">🛡️</div>
                  <h4>Safe & Secure</h4>
                  <p>All passengers are verified for your safety</p>
                </div>
              </div>
              <div className="bcPostRide-tips">
                <h4>💡 Tips for a Great Ride</h4>
                <ul>
                  <li>Be clear about pickup and drop-off points</li>
                  <li>Mention any stops you'll be making</li>
                  <li>Set fair pricing based on distance and fuel costs</li>
                  <li>Communicate with passengers before the trip</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostRide;
