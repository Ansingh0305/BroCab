import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Navbar from "../Navbar/Navbar";

const BACKGROUND_IMAGE = "/backgroundimg.png";

// Debounce function for API calls
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("search");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // State for search form
  const [searchData, setSearchData] = useState({
    pickup: "",
    destination: "",
    date: "",
  });

  // State for offer ride form
  const [offerData, setOfferData] = useState({
    pickup: "",
    destination: "",
    date: "",
    time: "",
    seats: 1,
    price: "",
  });

  // Location suggestions state
  const [searchSuggestions, setSearchSuggestions] = useState({
    pickup: [],
    destination: [],
  });
  const [offerSuggestions, setOfferSuggestions] = useState({
    pickup: [],
    destination: [],
  });
  const [showSearchSuggestions, setShowSearchSuggestions] = useState({
    pickup: false,
    destination: false,
  });
  const [showOfferSuggestions, setShowOfferSuggestions] = useState({
    pickup: false,
    destination: false,
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState({
    searchPickup: false,
    searchDestination: false,
    offerPickup: false,
    offerDestination: false,
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Premium locations with cleaner display names for the new UI
  const PREMIUM_LOCATIONS = [
    {
      keywords: [
        "scaler",
        "scaler micro",
        "scaler micro campus",
        "scaler school",
        "scaler academy",
        "scaler school of technology",
        "electronic city",
        "electronic city phase 1",
        "electronic city phase one",
      ],
      name: "Scaler Micro Campus",
      display_name: "Skyward Tech Park, Electronic City, Bengaluru",
      lat: 12.8456,
      lon: 77.6632,
      type: "education",
      category: "Tech Campus",
    },
    {
      keywords: [
        "uniworld",
        "uniworld 2",
        "uniworld city",
        "uniworld apartments",
      ],
      name: "Uniworld 2",
      display_name: "Neeladri Road, Electronic City, Bengaluru",
      lat: 12.8398,
      lon: 77.6745,
      type: "residential",
      category: "Apartment Complex",
    },
    {
      keywords: [
        "stanza",
        "stanza lisbon",
        "stanza living lisbon",
        "lisbon",
        "stanza living",
      ],
      name: "Stanza Living Lisbon",
      display_name: "Electronic City Phase 1, Bengaluru",
      lat: 12.8445,
      lon: 77.6678,
      type: "accommodation",
      category: "Co-living Space",
    },
    {
      keywords: [
        "airport",
        "kempegowda",
        "bangalore airport",
        "blr airport",
        "international airport",
        "bengaluru airport",
      ],
      name: "Kempegowda International Airport",
      display_name: "KIAL Rd, Devanahalli, Bengaluru",
      lat: 13.1986,
      lon: 77.7066,
      type: "airport",
      category: "Airport",
    },
    {
      keywords: [
        "ksr bangalore railway junction",
        "ksr",
        "bangalore railway station",
        "majestic railway station",
        "krantivira sangolli rayanna",
        "majestic",
        "bangalore city railway station",
      ],
      name: "KSR Bengaluru Station",
      display_name: "Majestic, Bengaluru City",
      lat: 12.9763,
      lon: 77.5619,
      type: "railway_station",
      category: "Railway Station",
    },
    {
      keywords: ["smvt", "smvt bengaluru"],
      name: "SMVT Bengaluru Station",
      display_name: "Sir M. Visvesvaraya Terminal, Baiyappanahalli",
      lat: 12.9946,
      lon: 77.6617,
      type: "railway_station",
      category: "Railway Station",
    },
    {
      keywords: ["yeswanthpur", "ypr"],
      name: "Yeswanthpur Station",
      display_name: "Yeswanthpur Junction, Bengaluru",
      lat: 13.0238,
      lon: 77.5523,
      type: "railway_station",
      category: "Railway Station",
    },
    {
      keywords: ["electronic city", "ecity"],
      name: "Electronic City",
      display_name: "Bengaluru, Karnataka",
      lat: 12.8456,
      lon: 77.6632,
      type: "area",
      category: "Tech Hub",
    },
    {
      keywords: ["koramangala"],
      name: "Koramangala",
      display_name: "Bengaluru, Karnataka",
      lat: 12.9279,
      lon: 77.6271,
      type: "area",
      category: "Commercial Area",
    },
  ];

  const [apiCache, setApiCache] = useState(new Map());

  const getSmartLocations = async (query) => {
    if (query.length < 2) return [];
    const searchQuery = query.toLowerCase().trim();
    const cacheKey = searchQuery;
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

    const results = [];
    const hardcodedMatches = PREMIUM_LOCATIONS.filter((location) =>
      location.keywords.some(
        (keyword) =>
          keyword.toLowerCase().includes(searchQuery) ||
          searchQuery.includes(keyword.toLowerCase())
      )
    ).map((location) => ({
      ...location,
      source: "premium",
      priority: 1,
    }));
    results.push(...hardcodedMatches);

    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in&limit=8&addressdetails=1`
      );
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        const nominatimResults = nominatimData.map((item) => ({
          name: item.display_name.split(",")[0],
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || "place",
          category: item.class || "Location",
          source: "nominatim",
          priority: 2,
        }));
        results.push(...nominatimResults);
      }
    } catch (error) {}

    const uniqueResults = results.filter(
      (result, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            Math.abs(r.lat - result.lat) < 0.001 &&
            Math.abs(r.lon - result.lon) < 0.001
        )
    );
    const sortedResults = uniqueResults
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 12);
    setApiCache((prev) => {
      const newCache = new Map(prev);
      newCache.set(cacheKey, sortedResults);
      if (newCache.size > 50) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      return newCache;
    });
    return sortedResults;
  };

  const debouncedLocationSearch = useCallback(
    debounce(async (query, fieldName, formType) => {
      if (query.length > 1) {
        const loadingKey = `${formType}${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        }`;
        setLoadingSuggestions((prev) => ({ ...prev, [loadingKey]: true }));
        const suggestions = await getSmartLocations(query);
        if (formType === "search") {
          setSearchSuggestions((prev) => ({
            ...prev,
            [fieldName]: suggestions,
          }));
          setShowSearchSuggestions((prev) => ({ ...prev, [fieldName]: true }));
        } else {
          setOfferSuggestions((prev) => ({
            ...prev,
            [fieldName]: suggestions,
          }));
          setShowOfferSuggestions((prev) => ({ ...prev, [fieldName]: true }));
        }
        setLoadingSuggestions((prev) => ({ ...prev, [loadingKey]: false }));
      } else {
        if (formType === "search")
          setShowSearchSuggestions((prev) => ({ ...prev, [fieldName]: false }));
        else
          setShowOfferSuggestions((prev) => ({ ...prev, [fieldName]: false }));
      }
    }, 150),
    [apiCache]
  );

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

  const handleCTAClick = (tab) => {
    setActiveTab(tab);
    const heroSection = document.querySelector(".bcDash-hero-section");
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({ ...prev, [name]: value }));
    if (name === "pickup" || name === "destination")
      debouncedLocationSearch(value, name, "search");
  };

  // CHANGE: Populates input with short name
  const handleSearchSuggestionSelect = (suggestion, fieldName) => {
    setSearchData((prev) => ({ ...prev, [fieldName]: suggestion.name }));
    setShowSearchSuggestions((prev) => ({ ...prev, [fieldName]: false }));
  };

  const handleOfferInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "time") {
      let formattedValue = value.replace(/[^\d:]/g, "");
      if (formattedValue.length === 2 && !formattedValue.includes(":")) {
        formattedValue += ":";
      } else if (
        formattedValue.length === 3 &&
        formattedValue.charAt(2) !== ":"
      ) {
        formattedValue = `${formattedValue.substring(
          0,
          2
        )}:${formattedValue.substring(2)}`;
      }
      if (formattedValue.length > 5)
        formattedValue = formattedValue.substring(0, 5);
      const [hours, minutes] = formattedValue.split(":");
      if (hours && parseInt(hours) > 23) formattedValue = `23:${minutes || ""}`;
      if (minutes && parseInt(minutes) > 59) formattedValue = `${hours}:59`;
      setOfferData((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setOfferData((prev) => ({ ...prev, [name]: value }));
      if (name === "pickup" || name === "destination")
        debouncedLocationSearch(value, name, "offer");
    }
  };

  // CHANGE: Populates input with short name
  const handleOfferSuggestionSelect = (suggestion, fieldName) => {
    setOfferData((prev) => ({ ...prev, [fieldName]: suggestion.name }));
    setShowOfferSuggestions((prev) => ({ ...prev, [fieldName]: false }));
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchSuggestions({ pickup: false, destination: false });
      setShowOfferSuggestions({ pickup: false, destination: false });
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSearchRide = (e) => {
    e.preventDefault();
    if (!searchData.pickup || !searchData.destination || !searchData.date) {
      alert("Please fill in all fields before searching");
      return;
    }
    const searchParams = new URLSearchParams({
      origin: searchData.pickup,
      destination: searchData.destination,
      date: searchData.date,
    });
    navigate(`/available-rides?${searchParams.toString()}`);
  };

  const handleOfferRide = (e) => {
    e.preventDefault();
    if (
      !offerData.pickup ||
      !offerData.destination ||
      !offerData.date ||
      !offerData.time ||
      !offerData.price
    ) {
      alert("Please fill in all required fields");
      return;
    }
    navigate("/post-ride", { state: offerData });
  };

  return (
    <div
      className={`bcDash-container ${isLoaded ? "loaded" : ""}`}
      style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
    >
      <Navbar />

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
          <div className="bcDash-hero-text">
            <div className="bcDash-hero-title-box">
              <h1 className="bcDash-hero-title">Share the Journey.</h1>
              <h1 className="bcDash-hero-subtitle">Split the Cost.</h1>
            </div>
          </div>

          <div className="bcDash-premium-tab-container">
            <div className="bcDash-tab-background">
              <div
                className={`bcDash-liquid-indicator ${
                  activeTab === "search" ? "search-active" : "offer-active"
                }`}
              ></div>
            </div>

            <button
              className={`bcDash-premium-tab bcDash-search-tab ${
                activeTab === "search" ? "active" : ""
              }`}
              onClick={() => handleTabSwitch("search")}
              type="button"
            >
              <div className="bcDash-tab-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="m21 21-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="bcDash-tab-text">Find a Ride</span>
            </button>

            <button
              className={`bcDash-premium-tab bcDash-offer-tab ${
                activeTab === "offer" ? "active" : ""
              }`}
              onClick={() => handleTabSwitch("offer")}
              type="button"
            >
              <div className="bcDash-tab-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19M7 13v6a2 2 0 002 2h4a2 2 0 002-2v-6m-6 0h6"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="bcDash-tab-text">Offer a Ride</span>
            </button>
          </div>

          <div
            className={`bcDash-premium-form-wrapper ${
              isTransitioning ? "transitioning" : ""
            }`}
          >
            {activeTab === "search" && (
              <form
                className="bcDash-premium-form bcDash-search-form"
                onSubmit={handleSearchRide}
              >
                <div className="bcDash-form-header">
                  <h3 className="bcDash-form-title">Looking for a ride?</h3>
                  <p className="bcDash-form-subtitle">
                    Find available rides going your way
                  </p>
                </div>

                <div className="bcDash-premium-inputs">
                  <div
                    className="bcDash-premium-input-group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bcDash-input-icon bcDash-pickup-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <circle
                          cx="12"
                          cy="10"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="pickup"
                      placeholder="Enter pickup location"
                      className="bcDash-premium-input"
                      value={searchData.pickup}
                      onChange={handleSearchInputChange}
                      autoComplete="off"
                      required
                    />
                    <div className="bcDash-input-focus-line"></div>
                    {loadingSuggestions.searchPickup && (
                      <div className="bcDash-suggestions-loading">
                        <div className="bcDash-loading-spinner"></div>
                        <span>Finding locations...</span>
                      </div>
                    )}
                    {showSearchSuggestions.pickup &&
                      searchSuggestions.pickup.length > 0 &&
                      !loadingSuggestions.searchPickup && (
                        <div className="bcDash-suggestions-dropdown">
                          {searchSuggestions.pickup.map((suggestion, index) => (
                            <div
                              key={suggestion.place_id || index}
                              className="bcDash-suggestion-item"
                              onClick={() =>
                                handleSearchSuggestionSelect(
                                  suggestion,
                                  "pickup"
                                )
                              }
                            >
                              <div className="bcDash-suggestion-icon-wrapper">
                                📍
                              </div>
                              <div className="bcDash-suggestion-content">
                                <div className="bcDash-suggestion-name">
                                  {suggestion.name}
                                </div>
                                <div className="bcDash-suggestion-text">
                                  {suggestion.display_name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  <div
                    className="bcDash-premium-input-group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bcDash-input-icon bcDash-destination-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <circle
                          cx="12"
                          cy="10"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="destination"
                      placeholder="Enter destination"
                      className="bcDash-premium-input"
                      value={searchData.destination}
                      onChange={handleSearchInputChange}
                      autoComplete="off"
                      required
                    />
                    <div className="bcDash-input-focus-line"></div>
                    {loadingSuggestions.searchDestination && (
                      <div className="bcDash-suggestions-loading">
                        <div className="bcDash-loading-spinner"></div>
                        <span>Finding locations...</span>
                      </div>
                    )}
                    {showSearchSuggestions.destination &&
                      searchSuggestions.destination.length > 0 &&
                      !loadingSuggestions.searchDestination && (
                        <div className="bcDash-suggestions-dropdown">
                          {searchSuggestions.destination.map(
                            (suggestion, index) => (
                              <div
                                key={suggestion.place_id || index}
                                className="bcDash-suggestion-item"
                                onClick={() =>
                                  handleSearchSuggestionSelect(
                                    suggestion,
                                    "destination"
                                  )
                                }
                              >
                                <div className="bcDash-suggestion-icon-wrapper">
                                  🎯
                                </div>
                                <div className="bcDash-suggestion-content">
                                  <div className="bcDash-suggestion-name">
                                    {suggestion.name}
                                  </div>
                                  <div className="bcDash-suggestion-text">
                                    {suggestion.display_name}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>

                  <div className="bcDash-premium-input-group">
                    <div className="bcDash-input-icon bcDash-date-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="16"
                          y1="2"
                          x2="16"
                          y2="6"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="8"
                          y1="2"
                          x2="8"
                          y2="6"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="3"
                          y1="10"
                          x2="21"
                          y2="10"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="date"
                      className="bcDash-premium-input bcDash-date-input"
                      value={searchData.date}
                      onChange={handleSearchInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                    <div className="bcDash-input-focus-line"></div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bcDash-premium-btn bcDash-search-btn"
                >
                  <span className="bcDash-btn-text">Search Rides</span>
                  <div className="bcDash-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="bcDash-btn-ripple"></div>
                </button>
              </form>
            )}

            {activeTab === "offer" && (
              <form
                className="bcDash-premium-form bcDash-offer-form"
                onSubmit={handleOfferRide}
              >
                <div className="bcDash-form-header">
                  <h3 className="bcDash-form-title">Got a ride to share?</h3>
                  <p className="bcDash-form-subtitle">
                    Post your route and find travel buddies
                  </p>
                </div>

                <div className="bcDash-premium-inputs">
                  <div className="bcDash-input-row">
                    <div
                      className="bcDash-premium-input-group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="bcDash-input-icon bcDash-pickup-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <circle
                            cx="12"
                            cy="10"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="pickup"
                        placeholder="Pickup location"
                        className="bcDash-premium-input"
                        value={offerData.pickup}
                        onChange={handleOfferInputChange}
                        autoComplete="off"
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                      {loadingSuggestions.offerPickup && (
                        <div className="bcDash-suggestions-loading">
                          <div className="bcDash-loading-spinner"></div>
                          <span>Finding locations...</span>
                        </div>
                      )}
                      {showOfferSuggestions.pickup &&
                        offerSuggestions.pickup.length > 0 &&
                        !loadingSuggestions.offerPickup && (
                          <div className="bcDash-suggestions-dropdown">
                            {offerSuggestions.pickup.map(
                              (suggestion, index) => (
                                <div
                                  key={suggestion.place_id || index}
                                  className="bcDash-suggestion-item"
                                  onClick={() =>
                                    handleOfferSuggestionSelect(
                                      suggestion,
                                      "pickup"
                                    )
                                  }
                                >
                                  <div className="bcDash-suggestion-icon-wrapper">
                                    📍
                                  </div>
                                  <div className="bcDash-suggestion-content">
                                    <div className="bcDash-suggestion-name">
                                      {suggestion.name}
                                    </div>
                                    <div className="bcDash-suggestion-text">
                                      {suggestion.display_name}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>

                    <div
                      className="bcDash-premium-input-group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="bcDash-input-icon bcDash-destination-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <circle
                            cx="12"
                            cy="10"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="destination"
                        placeholder="Destination"
                        className="bcDash-premium-input"
                        value={offerData.destination}
                        onChange={handleOfferInputChange}
                        autoComplete="off"
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                      {loadingSuggestions.offerDestination && (
                        <div className="bcDash-suggestions-loading">
                          <div className="bcDash-loading-spinner"></div>
                          <span>Finding locations...</span>
                        </div>
                      )}
                      {showOfferSuggestions.destination &&
                        offerSuggestions.destination.length > 0 &&
                        !loadingSuggestions.offerDestination && (
                          <div className="bcDash-suggestions-dropdown">
                            {offerSuggestions.destination.map(
                              (suggestion, index) => (
                                <div
                                  key={suggestion.place_id || index}
                                  className="bcDash-suggestion-item"
                                  onClick={() =>
                                    handleOfferSuggestionSelect(
                                      suggestion,
                                      "destination"
                                    )
                                  }
                                >
                                  <div className="bcDash-suggestion-icon-wrapper">
                                    🎯
                                  </div>
                                  <div className="bcDash-suggestion-content">
                                    <div className="bcDash-suggestion-name">
                                      {suggestion.name}
                                    </div>
                                    <div className="bcDash-suggestion-text">
                                      {suggestion.display_name}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="bcDash-input-row">
                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-date-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <line
                            x1="16"
                            y1="2"
                            x2="16"
                            y2="6"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <line
                            x1="8"
                            y1="2"
                            x2="8"
                            y2="6"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <line
                            x1="3"
                            y1="10"
                            x2="21"
                            y2="10"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <input
                        type="date"
                        name="date"
                        className="bcDash-premium-input bcDash-date-input"
                        value={offerData.date}
                        onChange={handleOfferInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                      <div className="bcDash-input-focus-line"></div>
                    </div>

                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-time-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <polyline
                            points="12,6 12,12 16,14"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="time"
                        className="bcDash-premium-input bcDash-time-input"
                        value={offerData.time}
                        onChange={handleOfferInputChange}
                        placeholder="Leaving Time (HH:MM)"
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
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <circle
                            cx="8.5"
                            cy="7"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M20 8v6M23 11h-6"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
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
                        <option value={5}>5 Seats Available</option>
                        <option value={6}>6 Seats Available</option>
                      </select>
                      <div className="bcDash-input-focus-line"></div>
                    </div>

                    <div className="bcDash-premium-input-group">
                      <div className="bcDash-input-icon bcDash-price-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 3h12" />
                          <path d="M6 8h12" />
                          <path d="M6 13l8 8" />
                          <path d="M6 13c6 0 6-10 0-10" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        name="price"
                        placeholder="Total Price"
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

                <button
                  type="submit"
                  className="bcDash-premium-btn bcDash-offer-btn"
                >
                  <span className="bcDash-btn-text">Post Your Ride</span>
                  <div className="bcDash-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="bcDash-btn-ripple"></div>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <section className="bcDash-features-section">
        <div className="bcDash-features-container">
          <div className="bcDash-feature-card">
            <div className="bcDash-feature-icon bcDash-search-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="m21 21-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h3 className="bcDash-feature-title">Find Available Rides</h3>
            <p className="bcDash-feature-description">
              Browse through rides posted by other users. Search by pickup
              location, destination, and travel date to find the perfect ride
              that matches your schedule.
            </p>
            <div className="bcDash-feature-benefits">
              <div className="bcDash-benefit-item">
                ✓ Search by location & date
              </div>
              <div className="bcDash-benefit-item">✓ View driver profiles</div>
              <div className="bcDash-benefit-item">✓ See available seats</div>
              <div className="bcDash-benefit-item">
                ✓ Check price per person
              </div>
            </div>
            <div className="bcDash-feature-overlay"></div>
          </div>

          <div className="bcDash-feature-card">
            <div className="bcDash-feature-icon bcDash-post-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19M7 13v6a2 2 0 002 2h4a2 2 0 002-2v-6m-6 0h6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h3 className="bcDash-feature-title">Post Your Ride</h3>
            <p className="bcDash-feature-description">
              Share your planned trip with others. Set your route, departure
              time, available seats, and price per person. Let passengers book
              seats and split the cost.
            </p>
            <div className="bcDash-feature-benefits">
              <div className="bcDash-benefit-item">✓ Set your own route</div>
              <div className="bcDash-benefit-item">✓ Choose departure time</div>
              <div className="bcDash-benefit-item">
                ✓ Decide seat availability
              </div>
              <div className="bcDash-benefit-item">✓ Set fair pricing</div>
            </div>
            <div className="bcDash-feature-overlay"></div>
          </div>

          <div className="bcDash-feature-card">
            <div className="bcDash-feature-icon bcDash-book-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="8.5"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 8v6M23 11h-6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h3 className="bcDash-feature-title">Book & Connect</h3>
            <p className="bcDash-feature-description">
              Book seats on rides that match your needs. Connect with drivers
              and fellow passengers. View trip details, meet your travel
              companions, and enjoy shared journeys.
            </p>
            <div className="bcDash-feature-benefits">
              <div className="bcDash-benefit-item">✓ Book seats instantly</div>
              <div className="bcDash-benefit-item">
                ✓ Connect with travelers
              </div>
              <div className="bcDash-benefit-item">✓ View trip details</div>
              <div className="bcDash-benefit-item">✓ Share travel costs</div>
            </div>
            <div className="bcDash-feature-overlay"></div>
          </div>
        </div>
      </section>

      <footer className="bcDash-cta-section">
        <div className="bcDash-cta-content">
          <h2 className="bcDash-cta-title">Ready to Start Your Journey?</h2>
          <p className="bcDash-cta-description">
            Join BroCab community and start sharing rides. Post your trips or
            find rides posted by others. Connect, travel, and save money
            together.
          </p>
          <div className="bcDash-cta-buttons">
            <button
              className="bcDash-cta-btn bcDash-cta-primary"
              onClick={() => handleCTAClick("search")}
            >
              <span>Find a Ride</span>
            </button>
            <button
              className="bcDash-cta-btn bcDash-cta-secondary"
              onClick={() => handleCTAClick("offer")}
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
