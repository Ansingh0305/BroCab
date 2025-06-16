import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../firebase/AuthContext';
import { userAPI } from '../../utils/api';

const NAV_BREAKPOINT = 1036;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUserDetails, logout, currentUser } = useAuth();
  const [userName, setUserName] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= NAV_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= NAV_BREAKPOINT);
      if (window.innerWidth > NAV_BREAKPOINT) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const permanentClear = localStorage.getItem('notificationBadgePermanentlyClear');
    const lastClearTime = localStorage.getItem('notificationLastClearTime');
    if (permanentClear === 'true') {
      setUnreadCount(0);
      return;
    }
    if (lastClearTime && (Date.now() - parseInt(lastClearTime)) < 300000) {
      setUnreadCount(0);
      return;
    }
    if (currentUser && location.pathname !== '/notifications') {
      fetchUnreadCount();
    } else if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [currentUser, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
      localStorage.setItem('notificationBadgePermanentlyClear', 'true');
      localStorage.setItem('notificationLastClearTime', Date.now().toString());
      window.dispatchEvent(new CustomEvent('notificationBadgeCleared', { 
        detail: { cleared: true, timestamp: Date.now() } 
      }));
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleBadgeClear = () => {
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
    window.addEventListener('notificationBadgeCleared', handleBadgeClear);
    window.addEventListener('notificationsViewed', handleBadgeClear);
    window.addEventListener('notificationCleared', handleBadgeClear);
    document.addEventListener('visibilitychange', handlePageVisibility);
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
        } catch {
          setUserName('User');
        }
      }
    };
    fetchUserName();
  }, [currentUser, fetchUserDetails]);
  
  const fetchUnreadCount = async () => {
    if (!currentUser) return;
    const permanentClear = localStorage.getItem('notificationBadgePermanentlyClear');
    if (permanentClear === 'true') {
      setUnreadCount(0);
      return;
    }
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await userAPI.getUnreadCount();
      const count = data.unread_count || 0;
      if (permanentClear !== 'true') {
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    } catch {
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setUnreadCount(0);
    localStorage.setItem('notificationBadgePermanentlyClear', 'true');
    localStorage.setItem('notificationLastClearTime', Date.now().toString());
    window.dispatchEvent(new CustomEvent('notificationBadgeCleared', { 
      detail: { cleared: true, timestamp: Date.now() } 
    }));
    window.dispatchEvent(new CustomEvent('notificationsViewed'));
    window.dispatchEvent(new CustomEvent('notificationCleared'));
    try {
      navigate('/notifications');
      setTimeout(async () => {
        try {
          await userAPI.markAllNotificationsAsRead();
        } catch {}
      }, 100);
    } catch {
      navigate('/notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandClick = () => {
    const lastClearTime = localStorage.getItem('notificationLastClearTime');
    if (lastClearTime && (Date.now() - parseInt(lastClearTime)) > 600000) {
      localStorage.removeItem('notificationBadgePermanentlyClear');
    }
    if (location.pathname === '/dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

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
      localStorage.clear();
      sessionStorage.clear();
      setUserName(null);
      setUnreadCount(0);
      navigate('/login');
    } catch {
      setShowDropdown(false);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => setShowDropdown(true);
  const handleMouseLeave = () => setTimeout(() => setShowDropdown(false), 150);

  const shouldShowBadge = unreadCount > 0 && 
    location.pathname !== '/notifications' && 
    localStorage.getItem('notificationBadgePermanentlyClear') !== 'true';

  // Nav links for reuse in mobile drawer
  const navLinks = (
    <>
      <button 
        onClick={() => {navigate('/my-booked-rides'); setIsMobileMenuOpen(false);}} 
        className="bcDash-nav-link bcDash-nav-button"
        disabled={isLoading}
      >
        My Bookings
      </button>
      <button 
        onClick={() => {navigate('/privileges'); setIsMobileMenuOpen(false);}}
        className="bcDash-nav-link bcDash-nav-button"
        disabled={isLoading}
      >
        My Privilege
      </button>
      <button 
        onClick={() => {handleNotificationClick(); setIsMobileMenuOpen(false);}}
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
        onClick={() => {navigate('/my-rides'); setIsMobileMenuOpen(false);}} 
        className="bcDash-nav-link bcDash-nav-button"
        disabled={isLoading}
      >
        My Rides
      </button>
      <button 
        onClick={() => {navigate('/contact-us'); setIsMobileMenuOpen(false);}} 
        className="bcDash-contact-btn"
        disabled={isLoading}
      >
        Contact Us
      </button>
    </>
  );

  return (
    <>
      <nav className="bcDash-navbar">
        {/* Hamburger for mobile/tablet (left) */}
        {isMobile && (
          <button
            className={`bcDash-hamburger${isMobileMenuOpen ? ' open' : ''}`}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        )}

        <div 
          className="bcDash-nav-brand" 
          onClick={handleBrandClick}
          tabIndex={0}
          aria-label="Go to Dashboard"
        >
          BroCab
        </div>

        {/* Desktop nav links - only visible above 1036px */}
        {!isMobile && (
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
        )}

        <div className="bcDash-nav-auth">
          {currentUser ? (
            <>
              {!isMobile && (
                <button 
                  onClick={() => navigate('/contact-us')} 
                  className="bcDash-contact-btn"
                  disabled={isLoading}
                >
                  Contact Us
                </button>
              )}
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

      {/* Mobile nav drawer */}
      {isMobile && (
        <>
          <div className={`bcDash-mobile-menu${isMobileMenuOpen ? ' open' : ''}`}>
            <button 
              className="bcDash-mobile-close" 
              aria-label="Close navigation menu" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              &times;
            </button>
            <div className="bcDash-mobile-links">
              {navLinks}
            </div>
          </div>
          {isMobileMenuOpen && (
            <div 
              className="bcDash-mobile-overlay" 
              onClick={() => setIsMobileMenuOpen(false)} 
            />
          )}
        </>
      )}
    </>
  );
};

export default Navbar;
