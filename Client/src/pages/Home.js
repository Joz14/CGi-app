import React from 'react';

import '../styles/Home.css';
import knightImage from '../assets/knight.png';
export default function Home() {
  return (
    <div className="home-page">
      <header className="home-hero home-card">
        <div className="home-hero-overlay">
          <h1 className="home-title">From Grass-roots to Glory</h1>
          <p className="home-subtitle">Join CGi – the starting point for your competitive journey.</p>
          <button className="btn btn-register" onClick={() => window.location.href = 'http://localhost:3000/login'}>
            Register Your Team
          </button>
          <div className="home-hover-image-wrapper">
            <img src={knightImage} alt="Slide In Visual" className="home-hover-image" />
          </div>
        </div>
      </header>

      <main className="home-content">
        <section className="home-info-section home-card">
          <h2 className="home-section-title">About CGi</h2>
          <p><strong>2012:</strong> CGi was born through gaming, started by CGi Rusty and a crew of online friends.</p>
          <p><strong>2019:</strong> Transitioned into mobile gaming, launching “CGi Gods” – top 15 UK Clash Royale clan.</p>
          <p><strong>2025:</strong> With over 300 members, we’re growing global unity across the gaming community.</p>
        </section>

        <section className="home-info-section home-card">
          <h2 className="home-section-title">Mission & Vision</h2>
          <p><strong>Mission:</strong> Unite the e-gaming community and create growth opportunities for all players.</p>
          <p><strong>Vision:</strong> Be the first step in turning casual gamers into professionals through community-led leagues.</p>
        </section>

        <section className="home-info-section home-card">
          <h2 className="home-section-title">Our Core Values</h2>
          <ul className="home-core-values">
            <li><strong>Empowerment:</strong> Everyone has a voice.</li>
            <li><strong>Respect:</strong> Open-minded, equal treatment for all.</li>
            <li><strong>Teamwork:</strong> We grow as a unit.</li>
          </ul>
        </section>

        <section className="home-info-section home-card">
          <h2 className="home-section-title">What Makes Us Different</h2>
          <p>No more first-round knockouts or inaccessible tournaments. We offer all-year-round competition matched to your level. Gain recognition, build your legacy, and compete for real.</p>
        </section>
      </main>
    </div>
  );
}