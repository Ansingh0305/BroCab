import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./config";

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

  // Sign up function
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
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
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken(true);
      return {
        ...result,
        token,
      };
    } catch (error) {
      console.error("Google sign-in error:", error);
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
      // console.log("AuthContext: Adding bearer token to request:", token.substring(0, 20) + "...");
    } else {
      // console.warn("AuthContext: No authentication token available for API call");
    }

    // console.log("AuthContext: Making API call to:", url, "with headers:", headers);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response;
  };

  // Create user profile in backend with better error handling
  const createUserProfile = async (userData, userCredential = null) => {
    try {
      // If userCredential is provided, get token directly from it
      let token;
      if (userCredential && userCredential.user) {
        // Wait a moment for the token to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        token = await userCredential.user.getIdToken(true); // Force refresh
      } else {
        token = await getIdToken();
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      console.log("Creating user profile with token:", token.substring(0, 20) + "...");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch("https://brocab.onrender.com/user", {
        method: "POST",
        headers,
        body: JSON.stringify(userData),
      });

      console.log("User creation response status:", response.status);

      // Accept both 200 (user exists) and 201 (created) as success
      if (response.status === 200 || response.status === 201) {
        const result = await response.json();
        console.log("User profile created successfully:", result);
        return result;
      } else {
        const errorText = await response.text();
        console.error("User creation failed:", response.status, errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || "Network error" };
        }
        
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  };

  // Fetch user details and set user name
  const fetchUserDetails = async () => {
    let token = await getIdToken();
    if (token) {
      try {
        const response = await fetch("https://brocab.onrender.com/user", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
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
    logout,
    getIdToken,
    apiCall,
    createUserProfile,
    loading,
    fetchUserDetails,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
