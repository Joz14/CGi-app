import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/AssignClanPage.css';

export default function JoinClanForm() {
  const [clanCode, setClanCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setClanCode(e.target.value);
    if (error) setError('');
  };

  const validateForm = () => {
    if (!clanCode.trim()) {
      setError('Clan code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    console.log('Joined with code:', clanCode);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="assign-form">
      <label>Clan Code</label>
      <input
        name="clanCode"
        type="text"
        placeholder="Enter invite code"
        value={clanCode}
        onChange={handleChange}
        className={error ? 'input-error' : ''}
      />
      {error && <p className="input-error-text">{error}</p>}
      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="spinner" /> : 'Join Clan'}
      </button>
    </form>
  );
}
