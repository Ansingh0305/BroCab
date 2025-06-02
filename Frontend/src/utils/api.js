// API utility functions for making authenticated requests
import { auth } from '../firebase/config';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.brocab.onrender.com';

// Test connectivity with backend
export const pingServer = async () => {
  try {
    console.log('Pinging server...');
    const response = await fetch(`${API_BASE_URL}/ping`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Ping response:', data);
    return data;
  } catch (error) {
    console.error('Ping error:', error);
    throw error;
  }
};

// Get auth token from Firebase user with better error handling
const getAuthToken = async () => {
  try {
    // Get current user directly from auth
    const user = auth.currentUser;
    
    if (user) {
      const token = await user.getIdToken(true); // Force refresh
      console.log('Successfully got auth token:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('No authenticated user found');
      return null;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Generic API call function with automatic token attachment
export const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('Adding bearer token to request:', token.substring(0, 20) + '...');
  } else {
    console.warn('No authentication token available for API call');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  console.log('Making API call to:', url, 'with method:', options.method || 'GET');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP error! status: ${response.status}` 
      }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Specific API functions for your backend
export const userAPI = {
  // Create user profile
  create: async (userData) => {
    const response = await apiCall('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Get user basic info
  getBasic: async (userID) => {
    const response = await apiCall(`/user/${userID}`);
    return response.json();
  },

  // Get user's posted rides
  getPostedRides: async () => {
    const response = await apiCall('/user/rides/posted');
    return response.json();
  },

  // Get user's joined rides
  getJoinedRides: async () => {
    const response = await apiCall('/user/rides/joined');
    return response.json();
  },

  // Get user privileges
  getPrivileges: async () => {
    try {
      console.log('Calling privileges endpoint');
      const response = await apiCall('/user/privileges');
      const data = await response.json();
      console.log('Raw privileges response:', data);
      return data;
    } catch (err) {
      console.error('Error in getPrivileges:', err);
      throw err;
    }
  },

  // Get user's sent join requests
  getSentRequests: async () => {
    const response = await apiCall('/user/requests');
    return response.json();
  },

  // Get notifications
  getNotifications: async () => {
    try {
      console.log('userAPI.getNotifications: Starting request...');
      const response = await apiCall('/user/notifications');
      console.log('userAPI.getNotifications: Got response:', response);
      console.log('userAPI.getNotifications: Response status:', response.status);
      console.log('userAPI.getNotifications: Response headers:', response.headers);
      
      const data = await response.json();
      console.log('userAPI.getNotifications: Parsed JSON data:', data);
      return data;
    } catch (error) {
      console.error('userAPI.getNotifications: Error occurred:', error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await apiCall('/user/notifications/unread-count');
    return response.json();
  },

  // Cancel ride participation (unified - handles both pending requests and participation)
  cancelRide: async (rideID) => {
    const response = await apiCall(`/user/cancel-ride/${rideID}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Clear involvement for a specific date (requests and privileges)
  clearInvolvementForDate: async (date) => {
    const response = await apiCall(`/user/clear-involvement/${date}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

export const rideAPI = {
  // Create a new ride
  create: async (rideData) => {
    const response = await apiCall('/ride', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
    return response.json();
  },

  // Get ride leader info
  getLeader: async (rideID) => {
    const response = await apiCall(`/ride/${rideID}/leader`);
    return response.json();
  },

  // Filter rides
  filter: async (origin, destination, date) => {
    const params = new URLSearchParams({ origin, destination, date });
    const response = await apiCall(`/ride/filter?${params}`);
    return response.json();
  },

  // Get join requests for a ride (leaders only)
  getRequests: async (rideID) => {
    const response = await apiCall(`/ride/${rideID}/requests`);
    return response.json();
  },

  // Send join request
  sendJoinRequest: async (rideID) => {
    const response = await apiCall(`/ride/${rideID}/join`, {
      method: 'POST',
    });
    return response.json();
  },

  // Cancel pending join request
  cancelJoinRequest: async (rideID) => {
    const response = await apiCall(`/ride/${rideID}/cancel-request`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Join ride with privilege
  joinWithPrivilege: async (rideID) => {
    const response = await apiCall(`/ride/${rideID}/join-ride`, {
      method: 'POST',
    });
    return response.json();
  },

  // Get participants (leaders only)
  getParticipants: async (rideID) => {
    const response = await apiCall(`/ride/${rideID}/participants`);
    return response.json();
  },

  // Remove participant (leaders only)
  removeParticipant: async (rideID, participantID) => {
    const response = await apiCall(`/ride/${rideID}/participant/${participantID}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Approve join request (leaders only)
  approveRequest: async (rideID, requestID) => {
    const response = await apiCall(`/ride/${rideID}/approve/${requestID}`, {
      method: 'POST',
    });
    return response.json();
  },

  // Reject join request (leaders only)
  rejectRequest: async (rideID, requestID) => {
    const response = await apiCall(`/ride/${rideID}/reject/${requestID}`, {
      method: 'POST',
    });
    return response.json();
  },
};

export const notificationAPI = {
  // Mark notification as read
  markAsRead: async (notificationID) => {
    const response = await apiCall(`/notification/${notificationID}/read`, {
      method: 'POST',
    });
    return response.json();
  },
};