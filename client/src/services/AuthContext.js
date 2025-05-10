import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      // Fetch user profile
      fetchUserProfile(userId)
        .then(user => {
          setCurrentUser(user);
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    try {
      const response = await axios.get(`/api/users/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Fetch user profile error:', error);
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/users/login', { email, password });
      
      // Save token and user ID
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      
      // Fetch user profile
      const user = await fetchUserProfile(response.data.userId);
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/users/register', { username, email, password });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setCurrentUser(null);
  };

  const createBot = async (name) => {
    try {

      const response = await axios.post('/api/bot-builder', {
        name: name,
        ownerId: currentUser._id
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Create bot error:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    createBot
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}