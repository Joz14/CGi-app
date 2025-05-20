import React, { useState } from 'react';

import CreateClanForm from './CreateClanPage';
import JoinClanForm from './JoinClanPage';
import '../../styles/AssignClanPage.css';

export default function AccessPage() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="assign-page">
      <div className="assign-card">
        <h1 className="assign-title">Join or Create a Clan</h1>
        <div className="assign-tab-switcher">
          <div className="assign-tab-bg">
            <div
              className={`assign-tab-indicator ${activeTab === 'join' ? 'right' : 'left'}`}
            />
          </div>

          <button
            className={`assign-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Clan
          </button>
          <button
            className={`assign-tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Clan
          </button>
        </div>
        <div className="assign-form-wrapper">
          {activeTab === 'create' ? <CreateClanForm /> : <JoinClanForm />}
        </div>
      </div>
    </div>

  );
}
