import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Navbar from '../Navbar/Navbar';

const BACKGROUND_IMAGE = '/backgroundimg.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('search');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // State for search form
  const [searchData, setSearchData] = useState({
    pickup: '',
    destination: '',
    date: ''
  });

  // State for offer ride form
  const [offerData, setOfferData] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: '',
    seats: 1,
    price: ''
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Handle tab switching with smooth transition
  const handleTabSwitch = (tab) => {
    if (tab === activeTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  // Handle CTA button clicks with scroll
  const handleCTAClick = (tab) => {
    setActiveTab(tab);
    
    // Scroll to form section
    const heroSection = document.querySelector('.bcDash-hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // NUCLEAR FIX: Handle offer input changes with time validation
  const handleOfferInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for time input
    if (name === 'time') {
      // Allow only HH:MM format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (value === '' || timeRegex.test(value)) {
        setOfferData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setOfferData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle search ride
  const handleSearchRide = (e) => {
    e.preventDefault();
    
    if (!searchData.pickup || !searchData.destination || !searchData.date) {
      alert('Please fill in all fields before searching');
      return;
    }

    const searchParams = new URLSearchParams({
      origin: searchData.pickup,
      destination: searchData.destination,
      date: searchData.date
    });

    navigate(`/available-rides?${searchParams.toString()}`);
  };

  // Handle offer ride
  const handleOfferRide = (e) => {
    e.preventDefault();
    
    if (!offerData.pickup || !offerData.destination || !offerData.date || !offerData.time || !offerData.price) {
      alert('Please fill in all required fields');
      return;
    }

    navigate('/post-ride', { state: offerData });
  };

  return (
    <div className={`bcDash-container ${isLoaded ? 'loaded' : ''}`} style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <Navbar />
      
      {/* Smooth Floating Particles */}
      <div className="bcDash-particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="bcDash-particle" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
            }}
          ></div>
        ))}
      </div>
      
      <div className="bcDash-main-content">
        <div className="bcDash-hero-section">
          {/* NUCLEAR FIX: Hero Text Box - EXACT SAME WIDTH AS FORM */}
          <div className="bcDash-hero-text">
            <div className="bcDash-hero-title-box">
              <h1 className="bcDash-hero-title">Share the Journey.</h1>
              <h1 className="bcDash-hero-subtitle">Split the Cost.</h1>
            </div>
          </div>

          {/* Premium Tab Switcher */}
          <div className="bcDash-premium-tab-container">
            <div className="bcDash-tab-background">
              <div className={`bcDash-liquid-indicator ${activeTab === 'search' ? 'search-active' : 'offer-active'}`}></div>
            </div>
            
            <button 
              className={`bcDash-premium-tab bcDash-search-tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('search')}
              type="button"
            >
              <div className="bcDash-tab-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="bcDash-tab-text">Find a Ride</span>
            </button>
            
            <button 
              className={`bcDash-premium-tab bcDash-offer-tab ${activeTab === 'offer' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('offer')}
              type="button"
            >
              <div className="bcDash-tab-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19M7 13v6a2 2 0 002 2h4a2 2 0 002-2v-6m-6 0h6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="bcDash-tab-text">Offer a Ride</span>
            </button>
          </div>

          {/* Premium Form Container - FIXED TRANSITION */}
          <div className={`bcDash-premium-form-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
            {/* Search Form */}
            {activeTab === 'search' && (
              <form className="bcDash-premium-form bcDash-search-form" onSubmit={handleSearchRide}>
                <div className="bcDash-form-header">
                  <h3 className="bcDash-form-title">Looking for a ride?</h3>
                  <p className="bcDash-form-subtitle">Find available rides going your way</p>
                </div>
                
                <div className="bcDash-premium-inputs">
                  <div className="bcDash-premium-input-group">
                    <div className="bcDash-input-icon bcDash-pickup-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      name="pickup"
                      placeholder="Enter pickup location" 
                      className="bcDash-premium-input"
                      value={searchData.pickup}
                      onChange={handleSearchInputChange}
                      required
                    />
                    <div className="bcDash-input-focus-line"></div>
                  </div>
                  
                  <div className="bcDash-premium-input-group">
                    <div className="bcDash-input-icon bcDash-destination-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      name="destination"
                      placeholder="Enter destination" 
                      className="bcDash-premium-input"
                      value={searchData.destination}
                      onChange={handleSearchInputChange}
                      required
                    />
                    <div className="bcDash-input-focus-line"></div>
                  </div>

                  <div className="bcDash-premium-input-group">
                    <div className="bcDash-input-icon bcDash-date-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <input 
                      type="date" 
                      name="date"
                      className="bcDash-premium-input bcDash-date-input"
                      value={searchData.date}
                      onChange={handleSearchInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <div className="bcDash-input-focus-line"></div>
                  </div>
                </div>

                <button type="submit" className="bcDash-premium-btn bcDash-search-btn">
                  <span className="bcDash-btn-text">Search Rides</span>
                  <div className="bcDash-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="bcDash-btn-ripple"></div>
                </button>
              </form>
            )}

            {/* Offer Ride Form */}
            {activeTab === 'offer' && (
              <form className="bcDash-premium-form bcDash-offer-form" onSubmit={handleOfferRide}>
                <div className="bcDash-form-header">
                  <h3 className="bcDash-form-title">Got a ride to share?</h3>
                  <p className="bcDash-form-subtitle">Post your route and find travel buddies</p>
                </div>
                
                <div className="bcDash-premium-inputs">
                  <div className="bcDash-input-row">
                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-pickup-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        name="pickup"
                        placeholder="Pickup location" 
                        className="bcDash-premium-input"
                        value={offerData.pickup}
                        onChange={handleOfferInputChange}
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                    </div>
                    
                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-destination-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        name="destination"
                        placeholder="Destination" 
                        className="bcDash-premium-input"
                        value={offerData.destination}
                        onChange={handleOfferInputChange}
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                    </div>
                  </div>

                  <div className="bcDash-input-row">
                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-date-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <input 
                        type="date" 
                        name="date"
                        className="bcDash-premium-input bcDash-date-input"
                        value={offerData.date}
                        onChange={handleOfferInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                    </div>

                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-time-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      {/* NUCLEAR FIX: Custom Time Input - NO MORE --:-- -- */}
                      <input 
                        type="text" 
                        name="time"
                        className="bcDash-premium-input bcDash-time-input"
                        value={offerData.time}
                        onChange={handleOfferInputChange}
                        placeholder="HH:MM (e.g., 14:30)"
                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                        title="Please enter time in HH:MM format (24-hour)"
                        maxLength="5"
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                    </div>
                  </div>

                  <div className="bcDash-input-row">
                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-seats-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <select 
                        name="seats"
                        className="bcDash-premium-input bcDash-select-input"
                        value={offerData.seats}
                        onChange={handleOfferInputChange}
                        required
                      >
                        <option value={1}>1 Seat Available</option>
                        <option value={2}>2 Seats Available</option>
                        <option value={3}>3 Seats Available</option>
                        <option value={4}>4 Seats Available</option>
                      </select>
                      <div className="bcDash-input-focus-line"></div>
                    </div>

                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-price-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <input 
                        type="number" 
                        name="price"
                        placeholder="Price per person (₹)" 
                        className="bcDash-premium-input bcDash-price-input"
                        value={offerData.price}
                        onChange={handleOfferInputChange}
                        min="1"
                        step="0.01"
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="bcDash-premium-btn bcDash-offer-btn">
                  <span className="bcDash-btn-text">Post Your Ride</span>
                  <div className="bcDash-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="bcDash-btn-ripple"></div>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FIXED: Realistic Feature Cards with Smooth Hover Effects */}
      <section className="bcDash-features-section">
        <div className="bcDash-features-container">
          <div className="bcDash-feature-card">
            <div className="bcDash-feature-icon bcDash-search-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="bcDash-feature-title">Find Available Rides</h3>
            <p className="bcDash-feature-description">
              Browse through rides posted by other users. Search by pickup location, destination, and travel date to find the perfect ride that matches your schedule.
            </p>
            <div className="bcDash-feature-benefits">
              <div className="bcDash-benefit-item">✓ Search by location & date</div>
              <div className="bcDash-benefit-item">✓ View driver profiles</div>
              <div className="bcDash-benefit-item">✓ See available seats</div>
              <div className="bcDash-benefit-item">✓ Check price per person</div>
            </div>
            <div className="bcDash-feature-overlay"></div>
          </div>

          <div className="bcDash-feature-card">
            <div className="bcDash-feature-icon bcDash-post-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19M7 13v6a2 2 0 002 2h4a2 2 0 002-2v-6m-6 0h6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="bcDash-feature-title">Post Your Ride</h3>
            <p className="bcDash-feature-description">
              Share your planned trip with others. Set your route, departure time, available seats, and price per person. Let passengers book seats and split the cost.
            </p>
            <div className="bcDash-feature-benefits">
              <div className="bcDash-benefit-item">✓ Set your own route</div>
              <div className="bcDash-benefit-item">✓ Choose departure time</div>
              <div className="bcDash-benefit-item">✓ Decide seat availability</div>
              <div className="bcDash-benefit-item">✓ Set fair pricing</div>
            </div>
            <div className="bcDash-feature-overlay"></div>
          </div>

          <div className="bcDash-feature-card">
            <div className="bcDash-feature-icon bcDash-book-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="bcDash-feature-title">Book & Connect</h3>
            <p className="bcDash-feature-description">
              Book seats on rides that match your needs. Connect with drivers and fellow passengers. View trip details, meet your travel companions, and enjoy shared journeys.
            </p>
            <div className="bcDash-feature-benefits">
              <div className="bcDash-benefit-item">✓ Book seats instantly</div>
              <div className="bcDash-benefit-item">✓ Connect with travelers</div>
              <div className="bcDash-benefit-item">✓ View trip details</div>
              <div className="bcDash-benefit-item">✓ Share travel costs</div>
            </div>
            <div className="bcDash-feature-overlay"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bcDash-stats-section">
        <div className="bcDash-stats-container">
          <div className="bcDash-stat-item">
            <div className="bcDash-stat-icon">🚀</div>
            <div className="bcDash-stat-number">New</div>
            <div className="bcDash-stat-label">Platform</div>
          </div>
          <div className="bcDash-stat-item">
            <div className="bcDash-stat-icon">🌟</div>
            <div className="bcDash-stat-number">Growing</div>
            <div className="bcDash-stat-label">Community</div>
          </div>
          <div className="bcDash-stat-item">
            <div className="bcDash-stat-icon">🔒</div>
            <div className="bcDash-stat-number">Secure</div>
            <div className="bcDash-stat-label">Platform</div>
          </div>
          <div className="bcDash-stat-item">
            <div className="bcDash-stat-icon">💡</div>
            <div className="bcDash-stat-number">Simple</div>
            <div className="bcDash-stat-label">Booking</div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <footer className="bcDash-cta-section">
        <div className="bcDash-cta-content">
          <h2 className="bcDash-cta-title">Ready to Start Your Journey?</h2>
          <p className="bcDash-cta-description">
            Join BroCab community and start sharing rides. Post your trips or find rides posted by others. Connect, travel, and save money together.
          </p>
        
          <div className="bcDash-cta-buttons">
            <button 
              className="bcDash-cta-btn bcDash-cta-primary"
              onClick={() => handleCTAClick('search')}
            >
              <span>Find a Ride</span>
             
            </button>
            <button 
              className="bcDash-cta-btn bcDash-cta-secondary"
              onClick={() => handleCTAClick('offer')}
            >
              <span>Offer a Ride</span>
            
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;