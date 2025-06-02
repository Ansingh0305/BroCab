import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../firebase/AuthContext';
import { userAPI } from '../../utils/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUserDetails, logout, currentUser } = useAuth();
  const [userName, setUserName] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // GLOBAL STATE MANAGEMENT FOR BADGE
  useEffect(() => {
    // Check localStorage for permanent badge clear flag
    const permanentClear = localStorage.getItem('notificationBadgePermanentlyClear');
    const lastClearTime = localStorage.getItem('notificationLastClearTime');
    
    if (permanentClear === 'true') {
      console.log('🔥 PERMANENT CLEAR FLAG ACTIVE - Badge stays at 0');
      setUnreadCount(0);
      return;
    }

    // If recently cleared (within 5 minutes), keep at 0
    if (lastClearTime && (Date.now() - parseInt(lastClearTime)) < 300000) {
      console.log('🔥 RECENTLY CLEARED - Badge stays at 0');
      setUnreadCount(0);
      return;
    }

    // Only fetch if user exists and not on notification page
    if (currentUser && location.pathname !== '/notifications') {
      fetchUnreadCount();
    } else if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [currentUser, location.pathname]);

  // FORCE CLEAR ON NOTIFICATIONS PAGE
  useEffect(() => {
    if (location.pathname === '/notifications') {
      console.log('🔥 ON NOTIFICATIONS PAGE - FORCE CLEARING BADGE');
      setUnreadCount(0);
      
      // Set permanent clear flag
      localStorage.setItem('notificationBadgePermanentlyClear', 'true');
      localStorage.setItem('notificationLastClearTime', Date.now().toString());
      
      // Dispatch global event
      window.dispatchEvent(new CustomEvent('notificationBadgeCleared', { 
        detail: { cleared: true, timestamp: Date.now() } 
      }));
    }
  }, [location.pathname]);

  // LISTEN FOR GLOBAL BADGE CLEAR EVENTS
  useEffect(() => {
    const handleBadgeClear = (event) => {
      console.log('🔥 RECEIVED BADGE CLEAR EVENT');
      setUnreadCount(0);
      localStorage.setItem('notificationBadgePermanentlyClear', 'true');
      localStorage.setItem('notificationLastClearTime', Date.now().toString());
    };

    const handlePageVisibility = () => {
      if (!document.hidden && location.pathname === '/notifications') {
        setUnreadCount(0);
        localStorage.setItem('notificationBadgePermanentlyClear', 'true');
      }
    };

    // Add event listeners
    window.addEventListener('notificationBadgeCleared', handleBadgeClear);
    window.addEventListener('notificationsViewed', handleBadgeClear);
    window.addEventListener('notificationCleared', handleBadgeClear);
    document.addEventListener('visibilitychange', handlePageVisibility);

    // Cleanup
    return () => {
      window.removeEventListener('notificationBadgeCleared', handleBadgeClear);
      window.removeEventListener('notificationsViewed', handleBadgeClear);
      window.removeEventListener('notificationCleared', handleBadgeClear);
      document.removeEventListener('visibilitychange', handlePageVisibility);
    };
  }, [location.pathname]);

  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        try {
          const userData = await fetchUserDetails();
          setUserName(userData?.name || 'User');
        } catch (error) {
          console.error("Failed to fetch user details:", error);
          setUserName('User');
        }
      }
    };
    
    fetchUserName();
  }, [currentUser, fetchUserDetails]);
  
  const fetchUnreadCount = async () => {
    if (!currentUser) return;
    
    // NEVER fetch if permanent clear flag is set
    const permanentClear = localStorage.getItem('notificationBadgePermanentlyClear');
    if (permanentClear === 'true') {
      setUnreadCount(0);
      return;
    }
    
    // Don't fetch if on notifications page
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
      return;
    }
    
    try {
      console.log('🔥 FETCHING UNREAD COUNT...');
      const data = await userAPI.getUnreadCount();
      const count = data.unread_count || 0;
      
      // Only set count if permanent clear flag is not set
      if (permanentClear !== 'true') {
        setUnreadCount(count);
        console.log('🔥 Fetched unread count:', count);
      } else {
        setUnreadCount(0);
        console.log('🔥 PERMANENT CLEAR ACTIVE - keeping at 0');
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async () => {
    if (isLoading) return;
    
    console.log('🔥 NOTIFICATION BUTTON CLICKED - PERMANENT CLEAR');
    setIsLoading(true);
    
    // PERMANENT CLEAR
    setUnreadCount(0);
    
    // Set permanent clear flags
    localStorage.setItem('notificationBadgePermanentlyClear', 'true');
    localStorage.setItem('notificationLastClearTime', Date.now().toString());
    
    // Dispatch global events to all navbar instances
    window.dispatchEvent(new CustomEvent('notificationBadgeCleared', { 
      detail: { cleared: true, timestamp: Date.now() } 
    }));
    window.dispatchEvent(new CustomEvent('notificationsViewed'));
    window.dispatchEvent(new CustomEvent('notificationCleared'));
    
    try {
      // Navigate immediately
      navigate('/notifications');
      
      // Background API call
      setTimeout(async () => {
        try {
          await userAPI.markAllNotificationsAsRead();
          console.log('🔥 Successfully marked all notifications as read');
        } catch (apiError) {
          console.error("API call failed:", apiError);
        }
      }, 100);
      
    } catch (error) {
      console.error("Navigation failed:", error);
      navigate('/notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandClick = () => {
    // Only reset permanent clear flag after 10 minutes
    const lastClearTime = localStorage.getItem('notificationLastClearTime');
    if (lastClearTime && (Date.now() - parseInt(lastClearTime)) > 600000) {
      localStorage.removeItem('notificationBadgePermanentlyClear');
      console.log('🔥 PERMANENT CLEAR FLAG EXPIRED - allowing new notifications');
    }
    
    if (location.pathname === '/dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  // Rest of your existing methods...
  const handleUpdateProfile = () => {
    navigate('/update-profile');
    setShowDropdown(false);
  };

  const handleMyRides = () => {
    navigate('/my-rides');
    setShowDropdown(false);
  };

  const handleRequested = () => {
    navigate('/requested');
    setShowDropdown(false);
  };

  const handleSignOut = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      await logout();
      setShowDropdown(false);
      localStorage.clear(); // This will clear all notification flags too
      sessionStorage.clear();
      setUserName(null);
      setUnreadCount(0);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setShowDropdown(false);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  // RENDER - Never show badge if permanent clear flag is set or on notifications page
  const shouldShowBadge = unreadCount > 0 && 
                         location.pathname !== '/notifications' && 
                         localStorage.getItem('notificationBadgePermanentlyClear') !== 'true';

  return (
    <nav className="bcDash-navbar">
      <div 
        className="bcDash-nav-brand" 
        onClick={handleBrandClick}
        style={{ cursor: 'pointer' }}
      >
        BroCab
      </div>
      
      <div className="bcDash-nav-links">
        <button 
          onClick={() => navigate('/my-booked-rides')} 
          className="bcDash-nav-link bcDash-nav-button"
          disabled={isLoading}
        >
          My Bookings
        </button>
        <button 
          onClick={() => navigate('/privileges')}
          className="bcDash-nav-link bcDash-nav-button"
          disabled={isLoading}
        >
          My Privilege
        </button>
        <button 
          onClick={handleNotificationClick}
          className="bcDash-nav-link bcDash-nav-button notification-btn"
          disabled={isLoading}
        >
          Notifications
          {shouldShowBadge && (
            <span className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => navigate('/my-rides')} 
          className="bcDash-nav-link bcDash-nav-button"
          disabled={isLoading}
        >
          My Rides
        </button>
      </div>
      
      <div className="bcDash-nav-auth">
        {currentUser ? (
          <>
            <button 
              onClick={() => navigate('/contact-us')} 
              className="bcDash-contact-btn"
              disabled={isLoading}
            >
              Contact Us
            </button>
            <div 
              className="bcDash-user-dropdown-wrapper"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="bcDash-profile-icon">
                <span className="bcDash-profile-initial">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              {showDropdown && (
                <div 
                  className="bcDash-user-dropdown"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button 
                    onClick={handleRequested} 
                    className="bcDash-dropdown-item"
                    disabled={isLoading}
                  >
                    Requested
                  </button>
                  <button 
                    onClick={handleUpdateProfile} 
                    className="bcDash-dropdown-item"
                    disabled={isLoading}
                  >
                    Update Profile
                  </button>
                  <button 
                    onClick={handleSignOut} 
                    className="bcDash-dropdown-item"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing Out...' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button 
              className="bcDash-login-btn" 
              onClick={() => navigate('/login')}
              disabled={isLoading}
            >
              Login
            </button>
            <button 
              className="bcDash-signup-btn" 
              onClick={() => navigate('/signup')}
              disabled={isLoading}
            >
              Signup
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;