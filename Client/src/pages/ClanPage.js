import { useEffect, useState } from 'react';
import MyClanPage from './clan/MyClanPage';
import AccessPage from './clan/AssignClanPage';

export default function ClanPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/account', { credentials: 'include' })
    
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        console.log('Fetched account:', data); // 👈 ADD THIS
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);



  return user?.clan ? (
    <MyClanPage userClan={user.clan} />
  ) : (
    <AccessPage />
  );
}
