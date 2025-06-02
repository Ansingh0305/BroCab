import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "./config";

// Create authentication context
const AuthContext = createContext();

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);

  // Get the API base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://www.brocab.onrender.com";

  // Sign up function
  const signup = async (email, password, displayName) => {
    try {
      console.log("Firebase Auth initialized:", auth);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Firebase user created:", userCredential);

      // Update the user's display name
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    try {
      console.log("Attempting Google sign-in...");
      
      // Check if running on an unauthorized domain and provide clear instructions
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['localhost', '127.0.0.1', 'brocab-1c545.firebaseapp.com']; // Add your authorized domains here
      
      if (!authorizedDomains.includes(currentDomain)) {
        console.warn(`Current domain (${currentDomain}) is not authorized in Firebase. Authentication might fail.`);
        console.warn(`Please add ${currentDomain} to Firebase Console -> Authentication -> Settings -> Authorized domains`);
      }
      
      // Add more specific settings for better browser compatibility
      const auth_settings = {
        // This helps prevent the popup from being blocked
        popup: true,
        // Add a longer timeout for network issues
        timeout: 30000
      };
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful:", result);
      
      // Log useful information for debugging without exposing sensitive data
      console.log("Successfully signed in user:", {
        displayName: result.user.displayName,
        email: result.user.email,
        uid: result.user.uid,
        isNewUser: result._tokenResponse?.isNewUser
      });
      
      return result;
    } catch (error) {
      console.error("Google sign-in error code:", error.code);
      console.error("Google sign-in error message:", error.message);
      
      // Additional handling for auth/unauthorized-domain error
      if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        console.error(`Domain ${currentDomain} is not authorized in Firebase Console.`);
        console.error(`Please add ${currentDomain} to Firebase Console -> Authentication -> Settings -> Authorized domains`);
        
        // Rethrow with more specific message
        const enhancedError = new Error(`Domain ${currentDomain} is not authorized for Firebase Authentication. Add it to Firebase Console -> Authentication -> Settings -> Authorized domains.`);
        enhancedError.code = error.code;
        throw enhancedError;
      }
      
      // Log additional error information
      if (error.customData) {
        console.error("Additional error data:", error.customData);
      }
      
      // Rethrow for handling in the UI layer
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIdToken(null);
      return await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Get current user's ID token
  const getIdToken = async () => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        setIdToken(token);
        return token;
      } catch (error) {
        console.error("Error getting ID token:", error);
        return null;
      }
    }
    return null;
  };

  // API call helper with automatic token attachment
  const apiCall = async (url, options = {}) => {
    const token = await getIdToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log(
        "AuthContext: Adding bearer token to request:",
        token.substring(0, 20) + "..."
      );
    } else {
      console.warn(
        "AuthContext: No authentication token available for API call"
      );
    }

    console.log(
      "AuthContext: Making API call to:",
      url,
      "with headers:",
      headers
    );

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response;
  };

  // Create user profile in backend
  const createUserProfile = async (userData, userCredential = null) => {
    try {
      // If userCredential is provided, use it directly. Otherwise, use currentUser
      const user = userCredential?.user || currentUser;
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Filter out undefined and empty string values from userData
      const cleanedUserData = Object.fromEntries(
        Object.entries(userData).filter(([key, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );

      // Ensure required fields are present
      if (!cleanedUserData.name || !cleanedUserData.email) {
        throw new Error('Name and email are required fields');
      }

      console.log('Original user data:', userData);
      console.log('Cleaned user data being sent to backend:', cleanedUserData);
      console.log('User UID:', user.uid);
      console.log('User email verified:', user.emailVerified);

      // Get the ID token
      const token = await user.getIdToken();
      console.log('Token obtained, length:', token.length);

      const requestBody = JSON.stringify(cleanedUserData);
      console.log('Request body being sent:', requestBody);

      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: requestBody
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        const responseText = await response.text();
        console.log('Raw error response text:', responseText);
        
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          errorData = { error: responseText || 'Unknown error' };
        }
        
        console.error('Backend error response:', errorData);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('User profile created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating user profile:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  };

  // Fetch user details and set user name
  const fetchUserDetails = async () => {
    let token = await getIdToken();
    console.log(typeof(token))
   
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/user`, {
          method: "GET",
          headers: {
            // "Content-Type": "application/json", // Recommended for JSON APIs
            "Authorization": `Bearer ${token}`, // Include the Bearer token
          },
        });

        if (response.ok) {
          const userData = await response.json();
          return userData; // Assuming the backend returns a 'name' field
        } else {
          console.error("Failed to fetch user details", response.status);
          return null;
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Get and store the ID token when user signs in
        try {
          const token = await user.getIdToken();
          setIdToken(token);
        } catch (error) {
          console.error("Error getting initial token:", error);
        }
      } else {
        setIdToken(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh token periodically (tokens expire after 1 hour)
  useEffect(() => {
    let tokenRefreshInterval;

    if (currentUser) {
      tokenRefreshInterval = setInterval(async () => {
        try {
          const token = await currentUser.getIdToken(true); // Force refresh
          setIdToken(token);
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }, 50 * 60 * 1000); // Refresh every 50 minutes
    }

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [currentUser]);

  const value = {
    currentUser,
    idToken,
    signup,
    login,
    signInWithGoogle,
    logout,
    getIdToken,
    apiCall,
    createUserProfile,
    loading,
    fetchUserDetails, // Expose fetchUserDetails function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
