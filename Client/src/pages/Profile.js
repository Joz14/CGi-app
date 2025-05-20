import { useEffect, useState } from 'react';
import '../styles/Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [clashTag, setTag] = useState('');
  const [displayName, setName] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/profile', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setUser(null);
        } else {
          return res.json();
        }
      })
      .then(data => {
        if (data) setUser(data);
      })
      .catch(() => setUser(null));
  }, []);

const handleLogout = () => {
  window.location.href = 'http://localhost:3000/custom-logout';
};

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <button className="logout-button" onClick={handleLogout}>
            Log Out
        </button>
        <img src={user.picture} alt="User avatar" className="profile-avatar" />
        <h2 className="profile-name">{user.displayName}</h2>
        <p className="profile-email">{user.email}</p>

        <div className="form-section">
          <h3>Update Profile</h3>

          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            className="input-field"
            value={displayName}
            onChange={e => setName(e.target.value)}
            placeholder="Enter a new display name"
          />

          <label htmlFor="clashTag">Clash Royale Tag</label>
          <input
            id="clashTag"
            className="input-field"
            value={clashTag}
            onChange={e => setTag(e.target.value)}
            placeholder="#ABC123"
          />

          <button
            className="gradient-button"
            onClick={() => {
              fetch('http://localhost:3000/profile/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ displayName, clashTag })
              })
                .then(res => res.json())
                .then(() => alert('Profile saved!'));
            }}
          >
            Save
          </button>


        </div>
      </div>
    </div>
  );
}
