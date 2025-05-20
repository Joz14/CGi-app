import { useNavigate } from 'react-router-dom';
import LoginButton from './LoginButton.js';
import '../styles/NavBar.css';
import logo from '../assets/CGi.png'; // Adjust path as needed

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={() => navigate('/')} role="button">
      <img src={logo} alt="CGi Logo" className="navbar-logo" />
      </div>
      <div className="navbar-center">
        <button className="nav-link" onClick={() => navigate('/leaderboard')}>Leaderboards</button>
      </div>
      <div className="navbar-right">
        <LoginButton />
      </div>
    </nav>
  );
}

