import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/LoginButton.css';
import '../styles/NavBar.css';

function LoginButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  const checkAuth = () => {
    fetch('http://localhost:3000/profileauth', {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(res => {
        if (res.status === 200) return res.json();
        throw new Error('Unauthenticated');
      })
      .then(data => setUser(data))
      .catch(() => setUser(null));
  };

  // 🔁 Re-check auth whenever the route changes
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/login';
  };

  if (user && user.picture) {
    return (
      <div className="avatar-container" onClick={() => navigate('/profile')}>
        <img src={user.picture} alt="Profile" className="nav-avatar" />
      </div>
    );
  }

  return (
    <button className="gradient-button" onClick={handleLogin}>
      Login
    </button>
  );
}

export default LoginButton;
