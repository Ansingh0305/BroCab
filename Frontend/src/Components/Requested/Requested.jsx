import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import Navbar from '../Navbar/Navbar';
import './Requested.css';

const BACKGROUND_IMAGE = '/backgroundimg.png';

const Requested = () => {
  const [requestedRides, setRequestedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { apiCall, currentUser, getIdToken } = useAuth();

  // Get API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.brocab.onrender.com';

  useEffect(() => {
    if (currentUser) {
      fetchRequestedRides();
    }
  }, [currentUser]);

  const fetchRequestedRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the ID token
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Make API call with proper headers including Bearer token
      const response = await fetch(`${API_BASE_URL}/user/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Always ensure we have an array
      setRequestedRides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching requested rides:', error);
      if (error.message.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load requested rides');
      }
      setRequestedRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (rideId) => {
    // Add debugging to check what rideId we're receiving
    console.log('Attempting to cancel ride with ID:', rideId);
    console.log('Type of rideId:', typeof rideId);
    
    if (!rideId || rideId === undefined) {
      alert('Invalid ride ID. Cannot cancel request.');
      return;
    }

    try {
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const cancelUrl = `${API_BASE_URL}/ride/${rideId}/cancel-request`;
      console.log('Cancel request URL:', cancelUrl);

      const response = await fetch(cancelUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cancel request error data:', errorData);
        
        if (response.status === 400) {
          throw new Error(errorData.message || 'Bad request - check if the request can be cancelled');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error('Ride request not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the cancelled request from the list using ride_id
      setRequestedRides(prev => (prev || []).filter(ride => ride?.ride_id !== rideId));
      alert('Request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling request:', error);
      if (error.message.includes('Authentication failed')) {
        alert('Session expired. Please login again.');
      } else {
        alert(`Failed to cancel request: ${error.message}`);
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Safe length check
  const ridesCount = (requestedRides && Array.isArray(requestedRides)) ? requestedRides.length : 0;

  // Show login prompt if user is not authenticated
  if (!currentUser) {
    return (
      <div className="bcRequested-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcRequested-main-content">
          <div className="bcRequested-error">
            <h2>Authentication Required</h2>
            <p>Please login to view your requested rides.</p>
            <button onClick={() => window.location.href = '/login'} className="bcRequested-retry-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bcRequested-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcRequested-main-content">
          <div className="bcRequested-loading">
            <div className="bcRequested-spinner"></div>
            <p>Loading your requested rides...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bcRequested-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcRequested-main-content">
          <div className="bcRequested-error">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={fetchRequestedRides} className="bcRequested-retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bcRequested-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <Navbar />
      
      <div className="bcRequested-main-content">
        {/* Header Section */}
        <div className="bcRequested-header">
          <h1>My Requested Rides</h1>
          <p>Track and manage your ride requests</p>
        </div>

        {/* Results Info */}
        <div className="bcRequested-results-info">
          <span className="bcRequested-results-count">
            {ridesCount} requests
          </span>
        </div>

        {/* Requests List */}
        <div className="bcRequested-content-wrapper">
          {ridesCount === 0 ? (
            <div className="bcRequested-no-rides">
              <div className="bcRequested-no-rides-icon">🚗</div>
              <h3>No ride requests yet</h3>
              <p>Start exploring available rides and make your first request!</p>
            </div>
          ) : (
            <div className="bcRequested-list">
              {(requestedRides || []).map((ride, index) => {
                // Debug logging
                console.log('Ride object:', ride);
                console.log('Ride ID:', ride?.ride_id);
                
                return (
                  <div key={ride?.ride_id || index} className="bcRequested-card">
                    <div className="bcRequested-card-content">
                      {/* Time and Route */}
                      <div className="bcRequested-time-route">
                        <div className="bcRequested-time-info">
                          <span className="bcRequested-departure-time">{formatTime(ride?.time)}</span>
                          <span className="bcRequested-duration">{ride?.duration || 'N/A'}</span>
                          <span className="bcRequested-arrival-time">
                            {ride?.arrival_time ? formatTime(ride.arrival_time) : 'N/A'}
                          </span>
                        </div>
                        <div className="bcRequested-route-info">
                          <span className="bcRequested-route-text">
                            {ride?.origin || 'N/A'} → {ride?.destination || 'N/A'}
                            {ride?.distance && <span className="bcRequested-distance"> • {ride.distance} km</span>}
                          </span>
                          <span className="bcRequested-date">{formatDate(ride?.date)}</span>
                        </div>
                      </div>

                      {/* Status and Details */}
                      <div className="bcRequested-details">
                        <div className="bcRequested-status-section">
                          <span 
                            className="bcRequested-status"
                            style={{ backgroundColor: getStatusColor(ride?.status) }}
                          >
                            {getStatusText(ride?.status)}
                          </span>
                          <span className="bcRequested-vehicle-type">{ride?.vehicle_type || 'Car'}</span>
                        </div>
                        <div className="bcRequested-request-info">
                          <span className="bcRequested-requested-date">
                            Requested: {formatDate(ride?.requested_at)}
                          </span>
                          <span className="bcRequested-price">₹{ride?.price || '0'}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="bcRequested-actions">
                        {ride?.status?.toLowerCase() === 'pending' && (
                          <button 
                            onClick={() => handleCancelRequest(ride.ride_id)} // Use ride_id here
                            className="bcRequested-cancel-btn"
                          >
                            Cancel Request
                          </button>
                        )}
                        {ride?.status?.toLowerCase() === 'approved' && (
                          <span className="bcRequested-approved-text">✓ Approved</span>
                        )}
                        {ride?.status?.toLowerCase() === 'rejected' && (
                          <span className="bcRequested-rejected-text">✗ Rejected</span>
                        )}
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

export default Requested;
