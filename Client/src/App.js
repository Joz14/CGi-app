import React from 'react';
import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Profile from './pages/Profile.js';
import Home from './pages/Home.js';
import ClanPage from './pages/ClanPage.js';
import LeaderboardPage from './pages/LeaderboardPage.js';
import Footer from './components/Footer.js';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clan" 
          element={
            <ProtectedRoute>
              <ClanPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;