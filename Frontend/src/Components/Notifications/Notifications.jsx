import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
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

  // Mark all notifications as read when component mounts (user views notifications)
  useEffect(() => {
    if (notifications.length > 0) {
      markAllAsReadOnView();
    }
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('https://www.brocab.onrender.com/user/notifications', {
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
      console.log('Notifications API Response:', data);
      
      let newNotifications = [];
      if (data && data.notifications && Array.isArray(data.notifications)) {
        newNotifications = data.notifications;
      } else if (Array.isArray(data)) {
        newNotifications = data;
      }

      setNotifications(newNotifications);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.message.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load notifications');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read when user views the notifications page
  const markAllAsReadOnView = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) return;

      // Mark all unread notifications as read
      const promises = unreadNotifications.map(notification =>
        fetch(`https://www.brocab.onrender.com/notification/${notification.notification_id}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(promises);

      // Update local state to mark all as read
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );

      // Dispatch event to clear navbar count
      window.dispatchEvent(new CustomEvent('notificationsViewed'));
      
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

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

  const getNotificationIcon = (title) => {
    const lowerTitle = title?.toLowerCase() || '';
    
    if (lowerTitle.includes('join request') || lowerTitle.includes('wants to join')) return '🙋‍♂️';
    if (lowerTitle.includes('accepted') || lowerTitle.includes('approved')) return '✅';
    if (lowerTitle.includes('rejected') || lowerTitle.includes('declined')) return '❌';
    if (lowerTitle.includes('new ride') || lowerTitle.includes('available')) return '🚗';
    if (lowerTitle.includes('cancelled')) return '🚫';
    if (lowerTitle.includes('reminder')) return '⏰';
    if (lowerTitle.includes('payment')) return '💳';
    return '📢';
  };

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    const title = notification.title?.toLowerCase() || '';
    if (title.includes('join request') || title.includes('wants to join')) {
      window.location.href = '/my-rides';
    } else if (title.includes('accepted') || title.includes('approved')) {
      window.location.href = '/my-booked-rides';
    } else if (title.includes('rejected')) {
      window.location.href = '/requested';
    }
  };

  if (!currentUser) {
    return (
      <div className="bcNotifications-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcNotifications-main-content">
          <div className="bcNotifications-error">
            <h2>Authentication Required</h2>
            <p>Please login to view your notifications.</p>
            <button onClick={() => window.location.href = '/login'} className="bcNotifications-back-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bcNotifications-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcNotifications-main-content">
          <div className="bcNotifications-loading">
            <div className="bcNotifications-spinner"></div>
            <p>Loading your notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bcNotifications-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
        <Navbar />
        <div className="bcNotifications-main-content">
          <div className="bcNotifications-error">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={fetchNotifications} className="bcNotifications-back-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bcNotifications-container" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <Navbar />
      
      <div className="bcNotifications-main-content">
        <div className="bcNotifications-header">
          <h1 className="bcNotifications-title">Notifications</h1>
          <p className="bcNotifications-subtitle">
            Stay updated with your ride activities
          </p>
        </div>

        <div className="bcNotifications-content-wrapper">
          {notifications.length === 0 ? (
            <div className="bcNotifications-empty">
              <div className="bcNotifications-empty-icon">📪</div>
              <h3>No notifications yet</h3>
              <p>You'll see your ride updates and alerts here.</p>
            </div>
          ) : (
            <div className="bcNotifications-list">
              {notifications.map((notification, index) => (
                <div 
                  key={`notification-${notification.notification_id}-${index}`} 
                  className="bcNotifications-card"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="bcNotifications-card-content">
                    <div className="bcNotifications-icon">
                      {getNotificationIcon(notification.title)}
                    </div>
                    
                    <div className="bcNotifications-content">
                      <div className="bcNotifications-header-row">
                        <h3 className="bcNotifications-notification-title">
                          {notification.title}
                        </h3>
                        <div className="bcNotifications-meta">
                          <span className="bcNotifications-time">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="bcNotifications-message">
                        {notification.message}
                      </p>
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
