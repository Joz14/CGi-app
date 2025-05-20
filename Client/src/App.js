import React from 'react';
import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Profile from './pages/Profile.js';
import Home from './pages/Home.js';
import ClanPage from './pages/ClanPage.js';
import LeaderboardPage from './pages/LeaderboardPage.js';
import Footer from './components/Footer';
import './App.css';
function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/clan" element={<ClanPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;