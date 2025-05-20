
import MyClanPage from './clan/MyClanPage';
import AccessPage from './clan/AssignClanPage';

export default function ClanPage() {
  const userClan = false; // Replace with real logic later

  return userClan ? (
    <MyClanPage userClan={userClan} />
  ) : (
    <AccessPage />
  );
}