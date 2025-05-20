import React, { useState } from 'react';
import '../styles/LeaderboardPage.css';

// Temporary data
const tempLeaderboardData = [
  { rank: 1, name: "Dragon Elite", wins: 156, members: 50, winRate: 78.5 },
  { rank: 2, name: "Royal Knights", wins: 145, members: 48, winRate: 75.2 },
  { rank: 3, name: "Thunder Clan", wins: 134, members: 45, winRate: 72.8 },
  { rank: 4, name: "Dark Warriors", wins: 128, members: 47, winRate: 70.1 },
  { rank: 5, name: "Phoenix Rising", wins: 120, members: 44, winRate: 68.5 }
];

export default function LeaderboardPage() {
  const [leaderboardData] = useState(tempLeaderboardData);

  return (
    <div className="leaderboard-container">
      <div className="glass-card">
        <h2>Global Clan Rankings</h2>
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col">Rank</div>
            <div className="col">Clan Name</div>
            <div className="col">Total Wins</div>
            <div className="col">Members</div>
            <div className="col">Win Rate</div>
          </div>
          {leaderboardData.map((clan) => (
            <div key={clan.rank} className="table-row">
              <div className="col">#{clan.rank}</div>
              <div className="col">{clan.name}</div>
              <div className="col">{clan.wins}</div>
              <div className="col">{clan.members}/50</div>
              <div className="col">{clan.winRate}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}