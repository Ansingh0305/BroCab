import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { userAPI, handleAPIError } from '../../utils/api';
import Navbar from '../Navbar/Navbar';
import './Notifications.css';

const BACKGROUND_IMAGE = '/backgroundimg.png';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, getIdToken } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching notifications for user:', currentUser?.uid);
      
      // Use the centralized API utility
      const data = await userAPI.getNotifications();
      console.log('Fetched notifications:', data);
      
      // Ensure we have an array
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
      
      console.log(`Successfully loaded ${notificationsArray.length} notifications`);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      const errorMessage = handleAPIError(err, 'fetching notifications');
      setError(errorMessage);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read when component loads
  useEffect(() => {
    const markAllAsRead = async () => {
      if (!currentUser || notifications.length === 0) return;
      
      try {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length === 0) return;
        
        console.log(`Marking ${unreadNotifications.length} notifications as read`);
        
        // Use the userAPI to mark all as read
        await userAPI.markAllNotificationsAsRead();
        
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        
        console.log('Successfully marked all notifications as read');
        
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        // Don't show error to user for this background operation
      }
    };
    
    // Only mark as read if we have notifications loaded
    if (notifications.length > 0) {
      markAllAsRead();
    }
  }, [notifications, currentUser]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'N/A';
    }
  };

  const getIcon = (type, title) => {
    const titleLower = title?.toLowerCase() || '';
    
    if (type === 'participant_removed') return '🚫';
    if (type === 'ride_cancelled') return '🚗❌';
    if (titleLower.includes('join request') || titleLower.includes('wants to join')) return '🙋‍♂️';
    if (titleLower.includes('accepted') || titleLower.includes('approved')) return '✅';
    if (titleLower.includes('rejected') || titleLower.includes('declined')) return '❌';
    if (titleLower.includes('new ride') || titleLower.includes('available')) return '🚗';
    if (titleLower.includes('cancelled')) return '🚫';
    if (titleLower.includes('reminder')) return '⏰';
    if (titleLower.includes('payment')) return '💳';
    return '📢';
  };

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    const title = notification.title?.toLowerCase() || '';
    const type = notification.type || '';
    
   if (title.includes('accepted') || title.includes('approved')) {
  window.location.href = '/privileges';}
  else if (title.includes('join request') || title.includes('wants to join')) {
      window.location.href = '/my-rides';
    } else if (title.includes('rejected') || type === 'request_rejected') {
      window.location.href = '/requested';
    } else if (type === 'ride_cancelled' || title.includes('cancelled')) {
      window.location.href = '/dashboard';
    }
  };

  if (!currentUser) {
    return (
      <div className="bcMyRides-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcMyRides-main-content">
          <div className="bcMyRides-error">
            <h2>Authentication Required</h2>
            <p>Please login to view your notifications.</p>
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
            <p>Loading your notifications...</p>
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
            <button onClick={fetchNotifications} className="bcMyRides-back-btn">
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
          <h1 className="bcMyRides-header-title">Notifications</h1>
          <p className="bcMyRides-header-subtitle">
            Stay updated with your ride activities
          </p>
        </div>

        {/* Results Info */}
        <div className="bcMyRides-results-info">
          <span className="bcMyRides-results-count">
            {notifications.length} notifications
          </span>
        </div>
        <div className="bcMyRides-content-wrapper">
          {notifications.length === 0 ? (
            <div className="bcMyRides-no-rides">
              <div className="bcMyRides-no-rides-icon">📪</div>
              <h3>No notifications yet</h3>
              <p>You'll see your ride updates and alerts here when they arrive.</p>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '16px' }}>
                If you're expecting notifications, try clicking the refresh button above.
              </p>
            </div>
          ) : (
            <div className="bcMyRides-list">
              {notifications.map((n, idx) => (
                <div 
                  key={n.id || idx} 
                  className="bcMyRides-card"
                  onClick={() => handleNotificationClick(n)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="bcMyRides-card-content" style={{ gridTemplateColumns: '60px 2fr 1fr' }}>
                    {/* Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span
                        style={{
                          fontSize: 36,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: 'white',
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(139,92,246,0.09)'
                        }}
                      >
                        {getIcon(n.type, n.title)}
                      </span>
                    </div>
                    
                    {/* Main Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 17, color: '#1e293b' }}>
                        {n.title || 'Notification'}
                      </span>
                      <span style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>
                        {n.message || 'No message'}
                      </span>
                      {n.origin && n.destination && n.origin !== 'Unknown' && (
                        <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 500, marginTop: 4 }}>
                          From <b>{n.origin}</b> to <b>{n.destination}</b>
                          {n.date && n.date !== 'Unknown' && (
                            <> &middot; {n.date} {n.time && n.time !== 'Unknown' ? n.time : ''}</>
                          )}
                        </span>
                      )}
                      {n.ride_status === 'deleted' && (
                        <span style={{ fontSize: 12, color: '#ef4444', fontStyle: 'italic' }}>
                          (Associated ride no longer available)
                        </span>
                      )}
                    </div>
                    
                    {/* Time */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                        {formatTime(n.created_at)}
                      </span>
                      {!n.is_read && (
                        <span style={{
                          fontSize: 12,
                          color: '#10b981',
                          background: '#e0f7ef',
                          borderRadius: 8,
                          padding: '2px 10px',
                          fontWeight: 700
                        }}>NEW</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
