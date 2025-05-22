import { useEffect, useState } from 'react';
import '../styles/Profile.css';
import validateAndSanitizeInput from '../utils/validate';
import { Loader2, Check } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [clashTag, setTag] = useState('');
  const [displayName, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'

useEffect(() => {
    fetch('http://localhost:3000/account', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setUser(null);
        } else {
          return res.json();
        }
      })
      .then(data => {
        if (data) {
          setUser(data);
          setName(data.displayName || '');
          setTag(data.clashTag || '');
        }
      })
      .catch(() => setUser(null));
  }, []);

const handleLogout = () => {
  // Use the backend logout endpoint with proper return URL
  window.location.href = 'http://localhost:3000/custom-logout';
};


const handleSubmit = async (e) => {
  e.preventDefault(); // Ensure it's not defaulting

  const nameResult = validateAndSanitizeInput(displayName, {
    maxLength: 20,
    allowAlphanumeric: true,
    fieldName: 'Display name'
  });

  const tagResult = validateAndSanitizeInput(clashTag, {
    maxLength: 15,
    allowAlphanumeric: true,
    allowSymbols: true,
    fieldName: 'Clash tag'
  });

  const newErrors = {};
  if (!nameResult.isValid) newErrors.displayName = nameResult.error;
  if (!tagResult.isValid) newErrors.clashTag = tagResult.error;

  setFieldErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }

  setSubmitStatus('submitting');

  try {
    const res = await fetch('http://localhost:3000/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        displayName: nameResult.sanitized,
        clashTag: tagResult.sanitized
      })
    });

    const data = await res.json();

    if (!data?.user) throw new Error('Invalid response');

    setUser((prev) => ({
      ...prev,
      displayName: data.user.displayName,
      clashTag: data.user.clashRoyaleTag
    }));

    setSubmitStatus('success');

    setTimeout(() => {
      setSubmitStatus('idle');
    }, 3000);
  } catch (err) {
    setSubmitStatus('idle');
  }
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

          <div className="display-name-row">
            <label htmlFor="displayName">Display Name</label>
            <p className="char-counter">{displayName.length} / 20</p>
          </div>
          <input
            id="displayName"
            className={`input-field ${fieldErrors.displayName ? 'input-error' : ''}`}
            value={displayName}
            onChange={e => setName(e.target.value)}
            placeholder="Enter a new display name"
          />
          {fieldErrors.displayName && <p className="input-error-text">{fieldErrors.displayName}</p>}

          <label htmlFor="clashTag">Clash Royale Tag</label>
          <input
            id="clashTag"
            className={`input-field ${fieldErrors.clashTag ? 'input-error' : ''}`}
            value={clashTag}
          onChange={e => setTag(e.target.value)}
          placeholder="#ABC123"
        />
        {fieldErrors.clashTag && <p className="input-error-text">{fieldErrors.clashTag}</p>}
        <button
          className={`gradient-button submit-btn ${submitStatus}`}
          onClick={handleSubmit}
          disabled={submitStatus === 'submitting'}
        >
          {submitStatus === 'submitting' && <Loader2 className="spinner spinning" />}
          {submitStatus === 'success' && <Check className="spinner tick" />}
          {submitStatus === 'idle' && 'Save'}
        </button>
        </div>
      </div>
    </div>
  );
}

