import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Available_rides.css';
import Navbar from '../Navbar/Navbar';
import { useAuth } from '../../firebase/AuthContext';
import { apiCall } from '../../utils/api';

const BACKGROUND_IMAGE = '/backgroundimg.png';

const Available_rides = () => {
  const [rides, setRides] = useState([]);
  const [requestedRides, setRequestedRides] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the auth context - get all needed functions at component level
  const { currentUser, getIdToken } = useAuth();

  // Get API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.brocab.onrender.com';

  // Get initial search parameters from URL
  const urlParams = new URLSearchParams(location.search);
  
  // Search form state
  const [searchForm, setSearchForm] = useState({
    origin: urlParams.get('origin')?.trim() || '',
    destination: urlParams.get('destination')?.trim() || '',
    date: urlParams.get('date')?.trim() || ''
  });

  // Function to get coordinates from location name using Nominatim (free geocoding)
  const getCoordinates = async (locationName) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

  // Function to calculate distance and duration using OSRM (free)
  const calculateRouteInfo = async (origin, destination) => {
    try {
      const originCoords = await getCoordinates(origin);
      const destCoords = await getCoordinates(destination);
      
      if (!originCoords || !destCoords) {
        return { distance: null, duration: null };
      }

      // OSRM Route API call for both distance and duration
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false&alternatives=false&steps=false`;
      
      const response = await fetch(osrmUrl);
      const data = await response.json();
      
      if (data && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distanceInKm = (route.distance / 1000).toFixed(1);
        const durationInMinutes = Math.round(route.duration / 60);
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = durationInMinutes % 60;
        
        let durationString;
        if (hours > 0) {
          durationString = `${hours}h ${minutes}m`;
        } else {
          durationString = `${minutes}m`;
        }
        
        return {
          distance: distanceInKm,
          duration: durationString
        };
      }
      
      return { distance: null, duration: null };
    } catch (error) {
      console.error('Error calculating route info:', error);
      return { distance: null, duration: null };
    }
  };

  // Function to calculate approximate price per person
  const calculateApproxPrice = (totalPrice, totalSeats, filledSeats) => {
    const passengerSeats = totalSeats - 1; // Exclude driver
    const filledPassengerSeats = filledSeats;
    const divisor = filledPassengerSeats === 0 ? passengerSeats : filledPassengerSeats + 1;
    const exactPrice = totalPrice / divisor;
    
    // Round to nearest 10 for approximate pricing
    return Math.round(exactPrice / 10) * 10;
  };

  // Function to fetch ride details and participants using auth context
  const fetchRideDetails = async (rideId) => {
    try {
      setLoadingDetails(true);
      const response = await apiCall(`${API_BASE_URL}/ride/${rideId}/participants`);
      const data = await response.json();
      setRideDetails(data);
    } catch (error) {
      console.error('Error fetching ride details:', error);
      if (error.message.includes('Session expired') || error.message.includes('Authentication failed')) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        alert('Failed to load ride details. Please try again.');
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle ride card click
  const handleRideClick = (ride) => {
    setSelectedRide(ride);
    fetchRideDetails(ride.id);
  };

  // Close modal
  const closeModal = () => {
    setSelectedRide(null);
    setRideDetails(null);
  };

  // Memoize the fetch function to prevent multiple calls
  const fetchAvailableRides = useCallback(async () => {
    if (!searchForm.origin || !searchForm.destination || !searchForm.date) {
      return;
    }

    // Check if user is authenticated
    if (!currentUser) {
      setError('Please login to search for rides.');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Build API URL with query parameters
      const apiParams = new URLSearchParams({
        origin: searchForm.origin.trim(),
        destination: searchForm.destination.trim(),
        date: searchForm.date.trim()
      });
      
      const apiUrl = `${API_BASE_URL}/ride/filter?${apiParams.toString()}`;
      console.log('Making API call to:', apiUrl);
      
      // Use the auth context's apiCall method
      const response = await apiCall(apiUrl);
      const data = await response.json();
      console.log('API Response received:', data);
      
      // Process rides and add route information
      let ridesData = [];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        ridesData = [data];
      } else if (Array.isArray(data)) {
        ridesData = data;
      }

      // Calculate route info for each ride
      const ridesWithRouteInfo = await Promise.all(
        ridesData.map(async (ride) => {
          const routeInfo = await calculateRouteInfo(ride.origin, ride.destination);
          const approxPrice = calculateApproxPrice(
            ride.price || 0, 
            ride.seats || 4, 
            ride.seats_filled || 0
          );
          
          return {
            ...ride,
            distance: routeInfo.distance,
            calculatedDuration: routeInfo.duration,
            approxPrice: approxPrice
          };
        })
      );
      
      setRides(ridesWithRouteInfo);
      
    } catch (err) {
      console.error('Error fetching rides:', err);
      if (err.message.includes('Session expired') || err.message.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
        navigate('/login');
      } else {
        setError(`Failed to fetch rides: ${err.message}`);
      }
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [searchForm.origin, searchForm.destination, searchForm.date, apiCall, currentUser, navigate]);

  // Use effect with proper dependency array
  useEffect(() => {
    fetchAvailableRides();
  }, [fetchAvailableRides]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    const trimmedOrigin = searchForm.origin.trim();
    const trimmedDestination = searchForm.destination.trim();
    const trimmedDate = searchForm.date.trim();
    
    if (!trimmedOrigin || !trimmedDestination || !trimmedDate) {
      alert('Please fill in all fields');
      return;
    }
    
    setSearchForm({
      origin: trimmedOrigin,
      destination: trimmedDestination,
      date: trimmedDate
    });
  };

  // Swap pickup and destination
  const handleSwapLocations = () => {
    setSearchForm(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
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

  const calculateArrivalTime = (departureTime, duration) => {
    if (!departureTime) return 'N/A';
    
    try {
      const [hours, minutes] = departureTime.split(':');
      const departure = new Date();
      departure.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If we have calculated duration, use it; otherwise use database duration
      let durationToAdd = duration;
      if (!durationToAdd || durationToAdd === 'N/A') {
        return 'N/A';
      }
      
      // Parse duration (could be "1h 30m" or "45m" format)
      let totalMinutes = 0;
      if (durationToAdd.includes('h')) {
        const parts = durationToAdd.split(' ');
        const hours = parseInt(parts[0].replace('h', ''));
        const mins = parts[1] ? parseInt(parts[1].replace('m', '')) : 0;
        totalMinutes = hours * 60 + mins;
      } else {
        totalMinutes = parseInt(durationToAdd.replace('m', ''));
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

  // CORRECTED handleBookRide function
  const handleBookRide = async (rideId) => {
    try {
      console.log(`Requesting to join ride with ID: ${rideId}`);
      
      // Get the ID token using the hook function at component level
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Make POST request to join the ride with Bearer token
      const response = await fetch(`${API_BASE_URL}/ride/${rideId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Bad request');
        } else if (response.status === 409) {
          throw new Error('You have already requested to join this ride');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert(`Join request sent successfully! ${result.message || 'You will be notified when the driver responds.'}`);
      
      // Refresh the rides list to update availability
      fetchAvailableRides();
      
      // Close modal if open
      if (selectedRide) {
        closeModal();
      }
      
    } catch (error) {
      console.error('Join request error:', error);
      if (error.message.includes('Authentication failed')) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        alert(`Failed to send join request: ${error.message}`);
      }
    }
  };

  const handleBackToSearch = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show login prompt if user is not authenticated
  if (!currentUser) {
    return (
      <div className="bcRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcRides-error">
          <h2>Authentication Required</h2>
          <p>Please login to search for rides.</p>
          <button onClick={() => navigate('/login')} className="bcRides-back-btn">Go to Login</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bcRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcRides-error">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={handleBackToSearch} className="bcRides-back-btn">Back to Search</button>
          <button onClick={fetchAvailableRides} className="bcRides-retry-btn" style={{marginLeft: '10px'}}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bcRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <Navbar />
      
      <div className="bcRides-main-content">
        {/* Search Form */}
        <div className="bcRides-search-section">
          <form onSubmit={handleSearch} className="bcRides-search-form">
            <div className="bcRides-search-inputs">
              <div className="bcRides-input-group">
                <label className="bcRides-input-label">From</label>
                <input
                  type="text"
                  name="origin"
                  value={searchForm.origin}
                  onChange={handleInputChange}
                  placeholder="Enter pickup location"
                  className="bcRides-location-input"
                  required
                />
              </div>

              <button 
                type="button" 
                onClick={handleSwapLocations}
                className="bcRides-swap-btn"
                title="Swap locations"
              >
                ⇄
              </button>

              <div className="bcRides-input-group">
                <label className="bcRides-input-label">To</label>
                <input
                  type="text"
                  name="destination"
                  value={searchForm.destination}
                  onChange={handleInputChange}
                  placeholder="Enter destination"
                  className="bcRides-location-input"
                  required
                />
              </div>

              <div className="bcRides-input-group">
                <label className="bcRides-input-label">Departure</label>
                <input
                  type="date"
                  name="date"
                  value={searchForm.date}
                  onChange={handleInputChange}
                  className="bcRides-date-input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <button type="submit" className="bcRides-search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="bcRides-loading">
            <div className="bcRides-spinner"></div>
            <p>Finding available rides and calculating routes...</p>
          </div>
        ) : (
          <>
            <div className="bcRides-results-info">
              <span className="bcRides-results-count">{rides.length} results</span>
            </div>

            <div className="bcRides-content-wrapper">
              {rides.length === 0 ? (
                <div className="bcRides-no-rides">
                  <div className="bcRides-no-rides-icon">🚗</div>
                  <h3>No rides found</h3>
                  <p>Try adjusting your search or check back later for new rides.</p>
                  <button onClick={handleBackToSearch} className="bcRides-back-btn">
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                <div className="bcRides-list">
                  {rides.map((ride, index) => (
                    <div 
                      key={ride.id || index} 
                      className="bcRides-card bcRides-clickable"
                      onClick={() => handleRideClick(ride)}
                    >
                      <div className="bcRides-card-content">
                        <div className="bcRides-time-route">
                          <div className="bcRides-time-info">
                            <span className="bcRides-departure-time">{formatTime(ride.time)}</span>
                            <span className="bcRides-duration">
                              {ride.calculatedDuration || ride.duration || 'N/A'}
                            </span>
                            <span className="bcRides-arrival-time">
                              {calculateArrivalTime(ride.time, ride.calculatedDuration || ride.duration)}
                            </span>
                          </div>
                          <div className="bcRides-route-info">
                            <span className="bcRides-route-text">
                              {ride.origin} - {ride.destination}
                              {ride.distance && <span className="bcRides-distance"> • {ride.distance} km</span>}
                            </span>
                          </div>
                        </div>

                        <div className="bcRides-vehicle-info">
                          <div className="bcRides-vehicle-details">
                            <span className="bcRides-vehicle-type">{ride.vehicle_type || 'Car'}</span>
                            <div className="bcRides-seats-display">
                              <span className="bcRides-seats-text">
                                {((ride.seats || 4) - 1) - (ride.seats_filled || 0)} seats available
                              </span>
                              <div className="bcRides-seats-visual">
                                {[...Array((ride.seats || 4) - 1)].map((_, seatIndex) => (
                                  <div 
                                    key={seatIndex} 
                                    className={`bcRides-seat-icon ${seatIndex < (ride.seats_filled || 0) ? 'filled' : 'empty'}`}
                                  >
                                    👤
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bcRides-price-book">
                          <div className="bcRides-price-info">
                            <span className="bcRides-price">~₹{ride.approxPrice || '0'}</span>
                            <span className="bcRides-price-label"> approx per person</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookRide(ride.id);
                            }}
                            className="bcRides-book-btn"
                            disabled={((ride.seats || 4) - 1) - (ride.seats_filled || 0) === 0}
                          >
                            {((ride.seats || 4) - 1) - (ride.seats_filled || 0) === 0 ? 'Fully Booked' : 'REQUEST NOW'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Premium Ride Details Modal */}
      {selectedRide && (
        <div className="bcRides-modal-overlay" onClick={closeModal}>
          <div className="bcRides-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bcRides-modal-header">
              <h2>Ride Details</h2>
              <button className="bcRides-modal-close" onClick={closeModal}>×</button>
            </div>

            {loadingDetails ? (
              <div className="bcRides-modal-loading">
                <div className="bcRides-spinner"></div>
                <p>Loading ride details...</p>
              </div>
            ) : (
              <div className="bcRides-modal-body">
                {/* Ride Information */}
                <div className="bcRides-modal-section">
                  <h3>Journey Information</h3>
                  <div className="bcRides-modal-journey">
                    <div className="bcRides-modal-route">
                      <div className="bcRides-modal-location">
                        <div className="bcRides-modal-location-dot bcRides-modal-origin"></div>
                        <div className="bcRides-modal-location-info">
                          <span className="bcRides-modal-location-label">From</span>
                          <span className="bcRides-modal-location-name">{selectedRide.origin}</span>
                        </div>
                      </div>
                      <div className="bcRides-modal-route-line"></div>
                      <div className="bcRides-modal-location">
                        <div className="bcRides-modal-location-dot bcRides-modal-destination"></div>
                        <div className="bcRides-modal-location-info">
                          <span className="bcRides-modal-location-label">To</span>
                          <span className="bcRides-modal-location-name">{selectedRide.destination}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bcRides-modal-details">
                      <div className="bcRides-modal-detail-item">
                        <span className="bcRides-modal-detail-label">Date</span>
                        <span className="bcRides-modal-detail-value">{formatDate(selectedRide.date)}</span>
                      </div>
                      <div className="bcRides-modal-detail-item">
                        <span className="bcRides-modal-detail-label">Departure</span>
                        <span className="bcRides-modal-detail-value">{formatTime(selectedRide.time)}</span>
                      </div>
                      <div className="bcRides-modal-detail-item">
                        <span className="bcRides-modal-detail-label">Duration</span>
                        <span className="bcRides-modal-detail-value">{selectedRide.calculatedDuration || selectedRide.duration || 'N/A'}</span>
                      </div>
                      <div className="bcRides-modal-detail-item">
                        <span className="bcRides-modal-detail-label">Distance</span>
                        <span className="bcRides-modal-detail-value">{selectedRide.distance ? `${selectedRide.distance} km` : 'N/A'}</span>
                      </div>
                      <div className="bcRides-modal-detail-item">
                        <span className="bcRides-modal-detail-label">Vehicle</span>
                        <span className="bcRides-modal-detail-value">{selectedRide.vehicle_type || 'Car'}</span>
                      </div>
                      <div className="bcRides-modal-detail-item">
                        <span className="bcRides-modal-detail-label">Price per person</span>
                        <span className="bcRides-modal-detail-value bcRides-modal-price">~₹{selectedRide.approxPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="bcRides-modal-section">
                  <h3>Fellow Travelers ({rideDetails?.length || 0})</h3>
                  {rideDetails && rideDetails.length > 0 ? (
                    <div className="bcRides-modal-participants">
                      {rideDetails.map((participant, index) => (
                        <div key={participant.participant_id} className="bcRides-modal-participant">
                          <div className="bcRides-modal-participant-avatar">
                            <span>{participant.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="bcRides-modal-participant-info">
                            <span className="bcRides-modal-participant-name">{participant.name}</span>
                            <span className="bcRides-modal-participant-gender">{participant.gender}</span>
                            <span className="bcRides-modal-participant-joined">
                              Joined {new Date(participant.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bcRides-modal-no-participants">
                      <p>No other participants yet. Be the first to join!</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bcRides-modal-actions">
                  <button 
                    className="bcRides-modal-request-btn"
                    onClick={() => handleBookRide(selectedRide.id)}
                    disabled={((selectedRide.seats || 4) - 1) - (selectedRide.seats_filled || 0) === 0}
                  >
                    {((selectedRide.seats || 4) - 1) - (selectedRide.seats_filled || 0) === 0 ? 'Fully Booked' : 'Request to Join'}
                  </button>
                  <button className="bcRides-modal-cancel-btn" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Available_rides;