import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import Navbar from '../Navbar/Navbar';
import './MyRides.css';

const BACKGROUND_IMAGE = '/backgroundimg.png';

const MyRides = () => {
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const { currentUser, getIdToken } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchMyRides();
    }
  }, [currentUser]);

  const fetchMyRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('https://brocab.onrender.com/user/rides/posted', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      console.log('My Rides API Response:', data);
      
      setMyRides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching my rides:', error);
      if (error.message.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load your rides');
      }
      setMyRides([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (rideId) => {
    try {
      setLoadingParticipants(true);
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://brocab.onrender.com/ride/${rideId}/participants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch participants: ${response.status}`);
      }

      const data = await response.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      alert('Failed to load participants');
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const fetchJoinRequests = async (rideId) => {
    try {
      setLoadingRequests(true);
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://brocab.onrender.com/ride/${rideId}/requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch join requests: ${response.status}`);
      }

      const data = await response.json();
      setJoinRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      alert('Failed to load join requests');
      setJoinRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleViewParticipants = (ride) => {
    setSelectedRide(ride);
    setShowParticipantsModal(true);
    fetchParticipants(ride.id || ride.leader_id);
  };

  const handleViewRequests = (ride) => {
    setSelectedRide(ride);
    setShowRequestsModal(true);
    fetchJoinRequests(ride.id || ride.leader_id);
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!window.confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://brocab.onrender.com/ride/${selectedRide.id || selectedRide.leader_id}/participant/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to remove participant');
      }

      setParticipants(prev => prev.filter(p => p.participant_id !== participantId));
      alert('Participant removed successfully!');
      fetchMyRides();
      
    } catch (error) {
      console.error('Error removing participant:', error);
      alert(`Failed to remove participant: ${error.message}`);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://brocab.onrender.com/ride/${selectedRide.id || selectedRide.leader_id}/approve/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to approve request');
      }

      alert('Request approved successfully!');
      fetchJoinRequests(selectedRide.id || selectedRide.leader_id);
      fetchMyRides();
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert(`Failed to approve request: ${error.message}`);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://brocab.onrender.com/ride/${selectedRide.id || selectedRide.leader_id}/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject request');
      }

      alert('Request rejected successfully!');
      fetchJoinRequests(selectedRide.id || selectedRide.leader_id);
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(`Failed to reject request: ${error.message}`);
    }
  };

  const handleDeleteRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to delete this ride?')) {
      return;
    }

    try {
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://brocab.onrender.com/ride/${rideId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete ride');
      }

      setMyRides(prev => prev.filter(ride => (ride.id || ride.leader_id) !== rideId));
      alert('Ride deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting ride:', error);
      alert(`Failed to delete ride: ${error.message}`);
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

  const getStatusColor = (seatsFilled, totalSeats) => {
    if (seatsFilled >= totalSeats) return '#6b7280';
    if (seatsFilled > 0) return '#10b981';
    return '#f59e0b';
  };

  const getStatusText = (seatsFilled, totalSeats) => {
    if (seatsFilled >= totalSeats) return 'Full';
    if (seatsFilled > 0) return 'Active';
    return 'Available';
  };

  const getRequestStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const ridesCount = (myRides && Array.isArray(myRides)) ? myRides.length : 0;

  if (!currentUser) {
    return (
      <div className="bcMyRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcMyRides-main-content">
          <div className="bcMyRides-error">
            <h2>Authentication Required</h2>
            <p>Please login to view your rides.</p>
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
            <p>Loading your rides...</p>
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
            <button onClick={fetchMyRides} className="bcMyRides-back-btn">
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
        <div className="bcMyRides-search-section">
          <h1 className="bcMyRides-header-title">My Rides</h1>
          <p className="bcMyRides-header-subtitle">
            Manage the rides you've posted
          </p>
        </div>

        {/* Results Info */}
        <div className="bcMyRides-results-info">
          <span className="bcMyRides-results-count">
            {ridesCount} posted rides
          </span>
        </div>

        {/* My Rides List */}
        <div className="bcMyRides-content-wrapper">
          {ridesCount === 0 ? (
            <div className="bcMyRides-no-rides">
              <div className="bcMyRides-no-rides-icon">🚗</div>
              <h3>No rides posted yet</h3>
              <p>Start by posting your first ride to share with others!</p>
              <button onClick={() => window.location.href = '/post-ride'} className="bcMyRides-back-btn">
                Post a Ride
              </button>
            </div>
          ) : (
            <div className="bcMyRides-list">
              {(myRides || []).map((ride, index) => {
                const rideId = ride.id || ride.leader_id;
                const uniqueKey = `${rideId}-${index}`;
                const availableSeats = (ride?.seats || 4) - (ride?.seats_filled || 0);
                const statusText = getStatusText(ride?.seats_filled || 0, ride?.seats || 4);
                const statusColor = getStatusColor(ride?.seats_filled || 0, ride?.seats || 4);
                
                return (
                  <div key={uniqueKey} className="bcMyRides-card">
                    <div className="bcMyRides-card-content">
                      {/* Time and Route */}
                      <div className="bcMyRides-time-route">
                        <div className="bcMyRides-time-info">
                          <span className="bcMyRides-departure-time">{formatTime(ride?.time)}</span>
                        </div>
                        <div className="bcMyRides-route-info">
                          <span className="bcMyRides-route-text">
                            {ride?.origin || 'N/A'} → {ride?.destination || 'N/A'}
                          </span>
                          <span className="bcMyRides-date">{formatDate(ride?.date)}</span>
                        </div>
                      </div>

                      {/* Vehicle and Status Info */}
                      <div className="bcMyRides-vehicle-info">
                        <div className="bcMyRides-vehicle-details">
                          <span 
                            className="bcMyRides-status"
                            style={{ backgroundColor: statusColor }}
                          >
                            {statusText}
                          </span>
                          <div className="bcMyRides-seats-display">
                            <span className="bcMyRides-seats-text">
                              {ride?.seats_filled || 0}/{ride?.seats || 4} seats filled
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="bcMyRides-price-actions">
                        <div className="bcMyRides-price-info">
                          <span className="bcMyRides-price">₹{ride?.price || '0'}</span>
                          <span className="bcMyRides-price-label"> total</span>
                        </div>
                        <div className="bcMyRides-action-buttons">
                          <button 
                            onClick={() => handleViewRequests(ride)}
                            className="bcMyRides-requests-btn"
                          >
                            📋 REQUESTS
                          </button>
                          <button 
                            onClick={() => handleViewParticipants(ride)}
                            className="bcMyRides-view-btn"
                          >
                            👥 PARTICIPANTS
                          </button>
                          <button 
                            onClick={() => handleDeleteRide(rideId)}
                            className="bcMyRides-delete-btn"
                          >
                            🗑️ DELETE
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

      {/* Join Requests Modal */}
      {showRequestsModal && (
        <div className="bcMyRides-modal-overlay" onClick={() => setShowRequestsModal(false)}>
          <div className="bcMyRides-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bcMyRides-modal-header">
              <h2>Join Requests</h2>
              <button className="bcMyRides-modal-close" onClick={() => setShowRequestsModal(false)}>×</button>
            </div>

            {loadingRequests ? (
              <div className="bcMyRides-modal-loading">
    <div className="bcMyRides-dots-loader">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <p>Loading join requests...</p>
  </div>
            ) : (
              <div className="bcMyRides-modal-body">
                <div className="bcMyRides-ride-info">
                  <h3>{selectedRide?.origin} → {selectedRide?.destination}</h3>
                  <p>{formatDate(selectedRide?.date)} at {formatTime(selectedRide?.time)}</p>
                </div>

                {joinRequests.length === 0 ? (
                  <div className="bcMyRides-no-participants">
                    <div className="bcMyRides-empty-icon">📋</div>
                    <p>No join requests yet</p>
                  </div>
                ) : (
                  <div className="bcMyRides-requests-list">
                    {joinRequests.map((request, index) => (
                      <div key={`request-${request.request_id}-${index}`} className="bcMyRides-request-card">
                        <div className="bcMyRides-request-info">
                          <div className="bcMyRides-request-avatar">
                            <span>{request.name?.charAt(0).toUpperCase() || 'U'}</span>
                          </div>
                          <div className="bcMyRides-request-details">
                            <span className="bcMyRides-request-name">{request.name || 'Unknown'}</span>
                            <span className="bcMyRides-request-gender">{request.gender || 'N/A'}</span>
                            <span 
                              className="bcMyRides-request-status"
                              style={{ color: getRequestStatusColor(request.status) }}
                            >
                              Status: {request.status || 'Pending'}
                            </span>
                          </div>
                        </div>
                        <div className="bcMyRides-request-actions">
                          {request.status?.toLowerCase() === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleApproveRequest(request.request_id)}
                                className="bcMyRides-approve-btn"
                              >
                                ✓ Approve
                              </button>
                              <button 
                                onClick={() => handleRejectRequest(request.request_id)}
                                className="bcMyRides-reject-btn"
                              >
                                ✗ Reject
                              </button>
                            </>
                          ) : (
                            <span 
                              className="bcMyRides-status-badge"
                              style={{ backgroundColor: getRequestStatusColor(request.status) }}
                            >
                              {request.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="bcMyRides-modal-overlay" onClick={() => setShowParticipantsModal(false)}>
          <div className="bcMyRides-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bcMyRides-modal-header">
              <h2>Ride Participants</h2>
              <button className="bcMyRides-modal-close" onClick={() => setShowParticipantsModal(false)}>×</button>
            </div>

            {loadingParticipants ? (
              <div className="bcMyRides-modal-loading">
    <div className="bcMyRides-spinner"></div>
    <p>Loading participants...</p>
  </div>
            ) : (
              <div className="bcMyRides-modal-body">
                <div className="bcMyRides-ride-info">
                  <h3>{selectedRide?.origin} → {selectedRide?.destination}</h3>
                  <p>{formatDate(selectedRide?.date)} at {formatTime(selectedRide?.time)}</p>
                </div>

                {participants.length === 0 ? (
                  <div className="bcMyRides-no-participants">
                    <div className="bcMyRides-empty-icon">👥</div>
                    <p>No participants yet</p>
                  </div>
                ) : (
                  <div className="bcMyRides-participants-list">
                    {participants.map((participant, index) => (
                      <div key={`participant-${participant.participant_id}-${index}`} className="bcMyRides-participant-card">
                        <div className="bcMyRides-participant-info">
                          <div className="bcMyRides-participant-avatar">
                            <span>{participant.name?.charAt(0).toUpperCase() || 'U'}</span>
                          </div>
                          <div className="bcMyRides-participant-details">
                            <span className="bcMyRides-participant-name">{participant.name || 'Unknown'}</span>
                            <span className="bcMyRides-participant-gender">{participant.gender || 'N/A'}</span>
                            <span className="bcMyRides-participant-joined">
                              Joined: {new Date(participant.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="bcMyRides-participant-actions">
                          <button 
                            onClick={() => handleDeleteParticipant(participant.participant_id)}
                            className="bcMyRides-remove-btn"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRides;
