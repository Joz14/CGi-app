import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const DEV_MODE = process.env.REACT_APP_DEV_MODE === 'true';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const AUTH_STORAGE_KEY = 'cgi-auth-known';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True until initial checkAuth completes
  const [error, setError] = useState(null);

  const updateAuthState = useCallback((authStatus, userData) => {
    setIsAuthenticated(authStatus);
    setUser(userData);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authStatus));
    } catch (e) {
      console.warn('Failed to save auth state to localStorage', e);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/profileauth`, { 
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data) {
        let userData = response.data;
        if (DEV_MODE) {
          userData = {
            ...response.data,
            picture: response.data.picture || null,
            nickname: response.data.nickname || 'Dev User',
            email: response.data.email || 'dev@example.com'
          };
        }
        updateAuthState(true, userData);
        setError(null);
      } else {
        throw new Error('Auth check response invalid');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      updateAuthState(false, null);
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, [updateAuthState]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async () => {
    setLoading(true); // Indicate loading during login process
    try {
      if (DEV_MODE) {
        const response = await axios.get(`${API_URL}/profileauth`, { 
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200 && response.data) {
          const userData = {
            ...response.data,
            picture: response.data.picture || null,
            nickname: response.data.nickname || 'Dev User',
            email: response.data.email || 'dev@example.com'
          };
          updateAuthState(true, userData);
          setError(null);
          setLoading(false);
          return '/profile'; 
        } else {
          throw new Error('Dev auth response invalid');
        }
      } else {
        window.location.href = `${API_URL}/login`;
        // setLoading(false) will not be reached here due to redirect
        return null; 
      }
    } catch (err) {
      console.error('Login error:', err);
      updateAuthState(false, null);
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
      return null;
    }
    // setLoading(false) should be ensured in all paths if not redirecting
  };

  const logout = async () => {
    setLoading(true); // Indicate loading during logout process
    try {
      if (DEV_MODE) {
        updateAuthState(false, null);
      } else {
        await axios.get(`${API_URL}/custom-logout`, { withCredentials: true });
        updateAuthState(false, null); // Ensure state is cleared after logout call
      }
      setError(null);
    } catch (err) {      
      setError(err.response?.data?.error || 'Logout failed');
      // Even on logout error, frontend state should reflect logged out
      updateAuthState(false, null); 
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    user,
    loading, // This is true during initial auth check AND during login/logout actions
    error,
    login,
    logout,
    checkAuth
  };
};

export default useAuth; 