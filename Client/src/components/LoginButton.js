import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/LoginButton.css';
import '../styles/NavBar.css';

const AUTH_STORAGE_KEY = 'cgi-auth-known'; // Same key as in useAuth

const getInitialAuthGuess = () => {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : false; // Default to not authenticated
  } catch (e) {
    console.warn('Failed to read auth state from localStorage', e);
    return false;
  }
};

const LoginButton = () => {
  const { isAuthenticated, user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  
  // This local loading state helps manage the spinner shape based on localStorage initially
  const [initialGuessIsAuth, setInitialGuessIsAuth] = useState(getInitialAuthGuess());

  // Update guess if actual auth state changes and we are no longer in initial authLoading phase
  useEffect(() => {
    if (!authLoading) {
      setInitialGuessIsAuth(isAuthenticated);
    }
  }, [isAuthenticated, authLoading]);

  const handleLogin = async () => {
    if (authLoading) return;
    // Login logic might set its own loading state if it involves multiple steps
    // For now, useAuth's loading state handles the overall auth action
    const redirectPath = await login();
    if (redirectPath) {
      navigate(redirectPath);
    }
  };

  // If useAuth is still performing its initial check, show placeholder based on guess
  if (authLoading) {
    const shapeClass = initialGuessIsAuth ? 'avatar-shape' : 'button-shape';
    return (
      <div className={`loading-placeholder ${shapeClass}`} aria-busy="true" aria-live="polite">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // After initial auth check, render based on actual isAuthenticated state
  if (isAuthenticated && user) {
    if (user.picture) {
      // Authenticated with picture: Show avatar
      return (
        <div className="avatar-container" onClick={() => navigate('/profile')} role="button" tabIndex={0}>
          <img 
            src={user.picture} 
            alt={user.nickname || 'Profile'} 
            className="nav-avatar" 
          />
        </div>
      );
    } else {
      // Authenticated, no picture (dev mode or missing): Show initials avatar
      const initials = (user.nickname || user.email || 'DU')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className="avatar-container" onClick={() => navigate('/profile')} role="button" tabIndex={0}>
          <div className="nav-avatar initials-avatar">
            {initials}
          </div>
        </div>
      );
    }
  }

  // Not authenticated: Show login button (ensure class is gradient-button if that's your theme)
  return (
    <button className="login-button gradient-button" onClick={handleLogin}>
      Login
    </button>
  );
};

export default LoginButton;
