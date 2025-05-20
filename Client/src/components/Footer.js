import React from 'react';
import '../styles/Footer.css'; // Create this
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="social-footer">
        <h4>Connect with us</h4>
        <div className="footer-social-icons">
          <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="https://discord.gg/yourinvite" target="_blank" rel="noopener noreferrer" aria-label="Discord">
            <i className="fab fa-discord"></i>
          </a>
          <a href="https://youtube.com/yourchannel" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <i className="fab fa-youtube"></i>
          </a>
          <a href="https://tiktok.com/@yourhandle" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <i className="fab fa-tiktok"></i>
          </a>
        </div>
      </div>

      <div className="main-footer">
        <p>&copy; 2025 CGi — Casual Gamer Innovations. All rights reserved.</p>
      </div>
    </footer>
  );
}