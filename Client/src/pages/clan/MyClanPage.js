import React, { useEffect, useState, useRef } from 'react';
import '../../styles/MyClanPage.css';

export default function MyClanPage({ userRoles }) {
  const isLeader = userRoles?.includes('clanLeader');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [clanData, setClanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Fetch clan data
  useEffect(() => {
    const fetchClanData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/clan', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const data = await response.json();
          setErrorMsg(data.error || 'Failed to fetch clan data');
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setClanData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching clan data:', err);
        setErrorMsg('Failed to connect to server');
        setLoading(false);
      }
    };
    
    fetchClanData();
  }, []);

  const leaveClan = async () => {
    setErrorMsg('');
    setSuccessMsg('');
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
    setErrorMsg('');
    setSuccessMsg('');
    
    const res = await fetch('http://localhost:3000/api/clan/delete', {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Failed to delete clan.');
    window.location.reload(); // Or redirect to home
  };

  const promoteMember = async (memberId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActiveMenu(null);
    
    try {
      const res = await fetch('http://localhost:3000/api/clan/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memberId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to promote member');
        return;
      }
      
      setSuccessMsg(data.message || 'Member promoted to leader');
      
      // Refresh clan data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error promoting member:', err);
      setErrorMsg('Error connecting to server');
    }
  };
  
  const kickMember = async (memberId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActiveMenu(null);
    
    if (!window.confirm('Are you sure you want to kick this member?')) {
      return;
    }
    
    try {
      const res = await fetch('http://localhost:3000/api/clan/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memberId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to kick member');
        return;
      }
      
      setSuccessMsg(data.message || 'Member removed from clan');
      
      // Refresh clan data to show updated member list
      const updatedResponse = await fetch('http://localhost:3000/api/clan', {
        credentials: 'include',
      });
      
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setClanData(updatedData);
      }
    } catch (err) {
      console.error('Error kicking member:', err);
      setErrorMsg('Error connecting to server');
    }
  };

  const handleMemberClick = (memberId) => {
    // For future: Navigate to member profile
    console.log('Clicked member:', memberId);
    // Could use Navigate from react-router-dom: navigate(`/profile/${memberId}`);
  };
  
  const toggleMenu = (index, event) => {
    event.stopPropagation(); // Prevent triggering the member click
    setActiveMenu(activeMenu === index ? null : index);
  };

  // Loading state
  if (loading) {
    return (
      <div className="clan-container">
        <div className="clan-dashboard">
          <h2>Loading clan data...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

return (
<div className="clan-container">
    <div className="clan-dashboard">
    <h2>{clanData?.name || 'My Clan'} <span className="clan-tag">{clanData?.tag || ''}</span></h2>

    <div className="clan-stats">
        <div className="stat-item">
          <span className="stat-label">Created</span>
          <span className="stat-value">{clanData?.createdAt ? new Date(clanData.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Members</span>
          <span className="stat-value">{clanData?.members?.length || 0}/{3}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Join Code</span>
          <span className="stat-value">{clanData?.joinCode || 'N/A'}</span>
        </div>
    </div>

    <div className="clan-members">
        <h3>Members</h3>
        <div className="members-list">
          {clanData?.members?.map((member, index) => (
            <div 
              key={index} 
              className="member-item"
              onClick={() => handleMemberClick(member.user._id)}
            >
              <div className="member-info">
                <span className="member-name">
                  {member.user.nickname}
                  {clanData?.leader?._id === member.user?._id && (
                    <span className="leader-badge"> 👑</span>
                  )}
                </span>
                <span className="member-joined">
                  Joined: {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
              
              {isLeader && clanData?.leader?._id !== member.user?._id && (
                <div className="member-actions">
                  <button 
                    className="action-button" 
                    onClick={(e) => toggleMenu(index, e)}
                    aria-label="Member options"
                  >
                    ⋮
                  </button>
                  
                  {activeMenu === index && (
                    <div className="action-menu" ref={menuRef}>
                      <button 
                        className="menu-item promote"
                        onClick={() => promoteMember(member.user._id)}
                      >
                        Promote to Leader
                      </button>
                      <button 
                        className="menu-item kick"
                        onClick={() => kickMember(member.user._id)}
                      >
                        Kick Member
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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

    {errorMsg && <p className="error-message">{errorMsg}</p>}
    {successMsg && <p className="success-message">{successMsg}</p>}
    </div>
</div>
);
}
