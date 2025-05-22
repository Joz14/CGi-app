import React from 'react';
import '../../styles/MyClanPage.css';

export default function MyClanPage({ userClan }) {
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
      </div>
    </div>
  );
}
