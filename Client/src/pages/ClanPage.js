import { useEffect, useState } from 'react';
import MyClanPage from './clan/MyClanPage';
import AccessPage from './clan/AssignClanPage';
import Loading from '../components/Loading';
export default function ClanPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = () => {
    setLoading(true);
  
    fetch('http://localhost:3000/account', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        console.log('Fetched account:', data);
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  if (loading) {
    return <Loading message="Loading..." />;
  }

  return user?.clan ? (
    <MyClanPage userRoles={user.roles} />
  ) : (
    <AccessPage onClanCreated={fetchAccount} />
  );
}
