import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import Navbar from '../Navbar/Navbar';
import './MyBookedRides.css'; // Use the new CSS file

const BACKGROUND_IMAGE = '/backgroundimg.png';

const MyBookedRides = () => {
  const [bookedRides, setBookedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, getIdToken } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchBookedRides();
    }
  }, [currentUser]);

  const fetchBookedRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('https://brocab.onrender.com/user/rides/joined', {
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
      setBookedRides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching booked rides:', error);
      if (error.message.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load booked rides');
      }
      setBookedRides([]);
    } finally {
      setLoading(false);
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

  const calculatePricePerPerson = (totalPrice, totalSeats, filledSeats) => {
    const passengerSeats = totalSeats - 1;
    const filledPassengerSeats = filledSeats;
    const divisor = filledPassengerSeats === 0 ? passengerSeats : filledPassengerSeats + 1;
    return Math.round(totalPrice / divisor);
  };

  const ridesCount = (bookedRides && Array.isArray(bookedRides)) ? bookedRides.length : 0;

  if (!currentUser) {
    return (
      <div className="bcMyRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcMyRides-main-content">
          <div className="bcMyRides-error">
            <h2>Authentication Required</h2>
            <p>Please login to view your booked rides.</p>
            <button onClick={() => window.location.href = '/login'} className="bcMyRides-back-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bcMyRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcMyRides-main-content">
          <div className="bcMyRides-loading">
            <div className="bcMyRides-spinner"></div>
            <p>Loading your booked rides...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bcMyRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcMyRides-main-content">
          <div className="bcMyRides-error">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={fetchBookedRides} className="bcMyRides-back-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bcMyRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <Navbar />
      
      <div className="bcMyRides-main-content">
        {/* Header Section */}
        <div className="bcMyRides-header-section">
          <h1>My Booked Rides</h1>
          <p>View and manage your confirmed ride bookings</p>
        </div>

        {/* Results Info */}
        <div className="bcMyRides-results-info">
          <span className="bcMyRides-results-count">
            {ridesCount} booked rides
          </span>
        </div>

        {/* Booked Rides List */}
        <div className="bcMyRides-content-wrapper">
          {ridesCount === 0 ? (
            <div className="bcMyRides-no-rides">
              <div className="bcMyRides-no-rides-icon">🎫</div>
              <h3>No booked rides yet</h3>
              <p>Start exploring available rides and book your first trip!</p>
              <button onClick={() => window.location.href = '/dashboard'} className="bcMyRides-back-btn">
                Find Rides
              </button>
            </div>
          ) : (
            <div className="bcMyRides-list">
              {(bookedRides || []).map((ride, index) => {
                const pricePerPerson = calculatePricePerPerson(
                  ride?.price || 0, 
                  ride?.seats || 4, 
                  ride?.seats_filled || 0
                );
                
                return (
                  <div key={ride?.leader_id || index} className="bcMyRides-card">
                    <div className="bcMyRides-card-content">
                      {/* Time and Route */}
                      <div className="bcMyRides-time-route">
                        <div className="bcMyRides-time-info">
                          <span className="bcMyRides-departure-time">{formatTime(ride?.time)}</span>
                          <span className="bcMyRides-duration">~1h 30m</span>
                          <span className="bcMyRides-arrival-time">
                            {calculateArrivalTime(ride?.time)}
                          </span>
                        </div>
                        <div className="bcMyRides-route-text">
                          {ride?.origin || 'N/A'} → {ride?.destination || 'N/A'}
                          <span className="bcMyRides-date">{formatDate(ride?.date)}</span>
                        </div>
                      </div>

                      {/* Vehicle and Status Info */}
                      <div className="bcMyRides-vehicle-details">
                        <span className="bcMyRides-vehicle-type">Booked</span>
                      </div>

                      {/* Price and Status */}
                      <div className="bcMyRides-price-status">
                        <div className="bcMyRides-price-info">
                          <span className="bcMyRides-price">₹{pricePerPerson}</span>
                          <span className="bcMyRides-price-label"> per person</span>
                        </div>
                        <div className="bcMyRides-status-confirmed">
                          ✓ CONFIRMED
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

export default MyBookedRides;
