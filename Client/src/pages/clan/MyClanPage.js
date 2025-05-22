import React from 'react';
import '../../styles/MyClanPage.css';
import { useState } from 'react';

export default function MyClanPage({ userClan, userRoles}) {
  const isLeader = userRoles?.includes('clanLeader');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const leaveClan = async () => {
    setErrorMsg('');
    const res = await fetch('http://localhost:3000/api/clan/leave', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Failed to leave clan.');
    window.location.reload(); // Or redirect to /clan-access
  };

  const deleteClan = async () => {
    if (!window.confirm('Are you sure you want to delete your clan?')) return;

    const res = await fetch('http://localhost:3000/api/clan/delete', {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Failed to delete clan.');
    window.location.reload(); // Or redirect to home
  };

return (
<div className="clan-container">
    <div className="clan-dashboard">
    <h2>{userClan?.name || 'Loading...'}</h2>

    <div className="clan-stats">
        <div className="stat-item">
        <span className="stat-label">Rank</span>
        <span className="stat-value">#1</span>
        </div>
        <div className="stat-item">
        <span className="stat-label">Members</span>
        <span className="stat-value">45/50</span>
        </div>
        <div className="stat-item">
        <span className="stat-label">Trophies</span>
        <span className="stat-value">3200</span>
        </div>
    </div>

    <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
        <div className="activity-item">
            <span className="activity-result win">Victory</span>
            <span className="activity-details">vs. Dragon Warriors</span>
            <span className="activity-time">2h ago</span>
        </div>
        <div className="activity-item">
            <span className="activity-result loss">Defeat</span>
            <span className="activity-details">vs. Royal Knights</span>
            <span className="activity-time">5h ago</span>
        </div>
        </div>
    </div>
    <div className="button-group" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn" onClick={leaveClan}>Leave Clan</button>
          {isLeader && (
            <button className="btn" style={{ marginLeft: '1rem', backgroundColor: '#f87171' }} onClick={deleteClan}>
              Delete Clan
            </button>
          )}
        </div>

    {errorMsg && <p style={{ color: 'red', marginTop: '1rem' }}>{errorMsg}</p>}
    {successMsg && <p style={{ color: 'green', marginTop: '1rem' }}>{successMsg}</p>}
    </div>
</div>
);
}
