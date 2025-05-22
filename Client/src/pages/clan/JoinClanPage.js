import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/AssignClanPage.css';

export default function JoinClanForm({onSuccess}) {
  const [clanCode, setClanCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = e => {
    setClanCode(e.target.value);
    setError('');
    setSuccessMessage('');
  };

  const validateForm = () => {
    if (!clanCode.trim()) {
      setError('Join code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('http://localhost:3000/api/clan/join', {
        method: 'POST',
        credentials: 'include', // Required to send Auth0 session cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ joinCode: clanCode })
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON: ${text}`);
      }
      if (res.ok) {
        onSuccess?.(); // Triggers fetchAccount in ClanPage
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join clan');
      }

      setSuccessMessage(`Successfully joined ${data.clan.name} ${data.clan.tag}`);
    } catch (err) {
      console.error('❌ Failed to join clan:', err);
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="assign-form">
      <label>Invite Code</label>
      <input
        name="clanCode"
        type="text"
        placeholder="Enter invite code"
        value={clanCode}
        onChange={handleChange}
        className={error ? 'input-error' : ''}
      />
      {error && <p className="input-error-text">{error}</p>}
      {successMessage && <p className="input-success-text">{successMessage}</p>}

      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="spinner" /> : 'Join Clan'}
      </button>
    </form>
  );
}
