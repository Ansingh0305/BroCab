import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { userAPI, rideAPI } from '../../utils/api';
import Navbar from '../Navbar/Navbar';
import './Privileges.css';

const BACKGROUND_IMAGE = '/backgroundimg.png';

const Privileges = () => {
  const [privilegeRides, setPrivilegeRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, getIdToken } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchPrivilegeRides();
    }
  }, [currentUser]);

  const fetchPrivilegeRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use centralized API function
      const data = await userAPI.getPrivileges();
      console.log('Privilege Rides API Response:', data);
      
      // Filter only rides where can_join is true (accepted rides needing confirmation)
      const acceptedRides = Array.isArray(data) ? data.filter(ride => ride.can_join === true) : [];
      setPrivilegeRides(acceptedRides);
    } catch (error) {
      console.error('Error fetching privilege rides:', error);
      if (error.message.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load privilege rides');
      }
      setPrivilegeRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRide = async (requestId, rideId) => {
    try {
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Get API base URL from environment
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.brocab.onrender.com';
      
      const response = await fetch(`${API_BASE_URL}/ride/${rideId}/join-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: requestId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(errorData.message || 'Failed to confirm ride');
      }

      // Remove confirmed ride from the list
      setPrivilegeRides(prev => prev.filter(ride => ride.request_id !== requestId));
      alert('Ride confirmed successfully! You will receive further details soon.');
      
    } catch (error) {
      console.error('Error confirming ride:', error);
      if (error.message.includes('Authentication failed')) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        alert(`Failed to confirm ride: ${error.message}`);
      }
    }
  };

  const handleDeclineRide = async (requestId, rideId) => {
    try {
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.brocab.onrender.com';

      const response = await fetch(`${API_BASE_URL}/ride/${rideId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: requestId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(errorData.message || 'Failed to decline ride');
      }

      // Remove declined ride from the list
      setPrivilegeRides(prev => prev.filter(ride => ride.request_id !== requestId));
      alert('Ride declined. The leader has been notified.');
      
    } catch (error) {
      console.error('Error declining ride:', error);
      if (error.message.includes('Authentication failed')) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        alert(`Failed to decline ride: ${error.message}`);
      }
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateArrivalTime = (departureTime, estimatedDuration = '1h 30m') => {
    if (!departureTime) return 'N/A';
    
    try {
      const [hours, minutes] = departureTime.split(':');
      const departure = new Date();
      departure.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      let totalMinutes = 90;
      if (estimatedDuration.includes('h')) {
        const parts = estimatedDuration.split(' ');
        const hrs = parseInt(parts[0].replace('h', ''));
        const mins = parts[1] ? parseInt(parts[1].replace('m', '')) : 0;
        totalMinutes = hrs * 60 + mins;
      } else {
        totalMinutes = parseInt(estimatedDuration.replace('m', ''));
      }
      
      const arrival = new Date(departure);
      arrival.setMinutes(arrival.getMinutes() + totalMinutes);
      
      return arrival.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const calculatePricePerPerson = (totalPrice, totalSeats, seatsAvailable) => {
    const filledSeats = totalSeats - seatsAvailable;
    const passengerSeats = totalSeats - 1; // Exclude driver
    const divisor = filledSeats === 0 ? passengerSeats : filledSeats + 1;
    return Math.round(totalPrice / divisor);
  };

  const ridesCount = (privilegeRides && Array.isArray(privilegeRides)) ? privilegeRides.length : 0;

  if (!currentUser) {
    return (
      <div className="bcPrivileges-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcPrivileges-main-content">
          <div className="bcPrivileges-error">
            <h2>Authentication Required</h2>
            <p>Please login to view your privileges.</p>
            <button onClick={() => window.location.href = '/login'} className="bcPrivileges-back-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bcPrivileges-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcPrivileges-main-content">
          <div className="bcPrivileges-loading">
            <div className="bcPrivileges-spinner"></div>
            <p>Loading your privileges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bcPrivileges-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcPrivileges-main-content">
          <div className="bcPrivileges-error">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={fetchPrivilegeRides} className="bcPrivileges-back-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bcPrivileges-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <Navbar />
      
      <div className="bcPrivileges-main-content">
        {/* Header Section */}
        <div className="bcPrivileges-search-section">
          <h1 className="bcPrivileges-header-title">My Privileges</h1>
          <p className="bcPrivileges-header-subtitle">
            Confirm your participation in rides where you've been accepted by the leader
          </p>
        </div>

        {/* Results Info */}
        <div className="bcPrivileges-results-info">
          <span className="bcPrivileges-results-count">
            {ridesCount} pending confirmations
          </span>
        </div>

        {/* Privilege Rides List */}
        <div className="bcPrivileges-content-wrapper">
          {ridesCount === 0 ? (
            <div className="bcPrivileges-no-rides">
              <div className="bcPrivileges-no-rides-icon">🎉</div>
              <h3>No pending confirmations</h3>
              <p>You don't have any rides waiting for your confirmation at the moment.</p>
              <button onClick={() => window.location.href = '/dashboard'} className="bcPrivileges-back-btn">
                Find New Rides
              </button>
            </div>
          ) : (
            <div className="bcPrivileges-list">
              {(privilegeRides || []).map((ride, index) => {
                const pricePerPerson = calculatePricePerPerson(
                  ride?.price || 0, 
                  ride?.total_seats || 4, 
                  ride?.seats_available || 0
                );
                
                return (
                  <div key={ride?.request_id || index} className="bcPrivileges-card">
                    <div className="bcPrivileges-card-content">
                      {/* Time and Route */}
                      <div className="bcPrivileges-time-route">
                        <div className="bcPrivileges-time-info">
                          <span className="bcPrivileges-departure-time">{formatTime(ride?.time)}</span>
                          <span className="bcPrivileges-duration">~1h 30m</span>
                          <span className="bcPrivileges-arrival-time">
                            {calculateArrivalTime(ride?.time)}
                          </span>
                        </div>
                        <div className="bcPrivileges-route-info">
                          <span className="bcPrivileges-route-text">
                            {ride?.origin || 'N/A'} → {ride?.destination || 'N/A'}
                          </span>
                          <span className="bcPrivileges-date">{formatDate(ride?.date)}</span>
                        </div>
                      </div>

                      {/* Vehicle and Status Info */}
                      <div className="bcPrivileges-vehicle-info">
                        <div className="bcPrivileges-vehicle-details">
                          <span className="bcPrivileges-vehicle-type">Accepted</span>
                          <div className="bcPrivileges-seats-display">
                            <span className="bcPrivileges-seats-text">
                              {ride?.seats_available || 0} seats available
                            </span>
                            <div className="bcPrivileges-seats-visual">
                              {[...Array(ride?.total_seats - 1 || 3)].map((_, seatIndex) => (
                                <div 
                                  key={seatIndex} 
                                  className={`bcPrivileges-seat-icon ${seatIndex < ((ride?.total_seats || 4) - (ride?.seats_available || 0) - 1) ? 'filled' : 'empty'}`}
                                >
                                  👤
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="bcPrivileges-price-actions">
                        <div className="bcPrivileges-price-info">
                          <span className="bcPrivileges-price">₹{pricePerPerson}</span>
                          <span className="bcPrivileges-price-label"> per person</span>
                        </div>
                        <div className="bcPrivileges-action-buttons">
                          <button 
                            onClick={() => handleConfirmRide(ride.request_id, ride.ride_id)}
                            className="bcPrivileges-confirm-btn"
                          >
                            ✓ CONFIRM
                          </button>
                          <button 
                            onClick={() => handleDeclineRide(ride.request_id, ride.ride_id)}
                            className="bcPrivileges-decline-btn"
                          >
                            ✗ DECLINE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Privileges;
