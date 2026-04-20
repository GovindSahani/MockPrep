import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>MockPrep</Link>
        
        {/* Hamburger button */}
        <button 
          className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Overlay */}
        {menuOpen && <div className="navbar-overlay" onClick={closeMenu} />}

        {/* Links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link" onClick={closeMenu}>Dashboard</Link>
              <Link to="/history" className="navbar-link" onClick={closeMenu}>History</Link>
              <Link to="/resume-review" className="navbar-link" onClick={closeMenu}>Resume Review</Link>
              <button className="btn-outline" onClick={() => { logout(); closeMenu(); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={closeMenu}>Login</Link>
              <Link to="/register" onClick={closeMenu}><button className="btn-primary">Get Started</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
