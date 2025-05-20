import React from 'react';
import { Route, Routes, } from 'react-router-dom';
import NavBar from './components/NavBar';
import Profile from './pages/Profile.js';
import Home from './pages/Home.js';
import Footer from './components/Footer';

// (Optional) You can move this into a separate file later

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
      
    </>
  );
}


export default App;
