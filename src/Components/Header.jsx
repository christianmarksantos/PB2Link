import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeAll = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    closeAll();
  };

  const navLinks = [
    { to: '/', label: 'Home', exact: true },
    { to: '/services', label: 'Services' },
    { to: user ? '/incident-report' : '/incident-report-dashboard', label: 'Report Incident' },
    { to: '/dashboard', label: 'Track Request' }
  ];

  const getActiveClass = (path) => location.pathname === path ? 'active' : '';

  return (
    <header id="main-header" className={isScrolled ? 'scrolled' : ''}>
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="brand-logo" onClick={closeAll}>
          <div className="logo-icon">
            <img 
              src="/assets/img/PB2_logo.png" 
              alt="Pasong Buaya 2 Logo" 
              style={{ width: '80px', height: 'auto', animation: 'pulseLogo 2s infinite ease-in-out' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <div className="logo-fallback" style={{ display: 'none' }}>
              PB2
            </div>
          </div>
          <div className="brand-text">
            <span className="brand-main">Pasong Buaya II</span>
            <span className="brand-sub">Digital Barangay Portal</span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          {navLinks.map((link, index) => (
            <a 
              key={index}
              href={link.to}
              className={getActiveClass(link.to)}
              onClick={closeAll}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {user ? (
            /* Logged In - User Dropdown */
            <div className="user-dropdown" onClick={toggleDropdown}>
              <div className="user-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="user-label">{user.email?.split('@')[0]}</span>
              <span className="dropdown-arrow">▼</span>
              
              <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-header">
                  <p>Signed in as</p>
                  <strong>{user.email}</strong>
                </div>
                <a href="/profile" onClick={closeAll}>👤 Edit Profile</a>
                <a href="/dashboard" onClick={closeAll}>📂 Dashboard</a>
                <div className="dropdown-divider"></div>
                <a href="#" className="logout-link" onClick={handleLogout}>🚪 Logout</a>
              </div>
            </div>
          ) : (
            /* Not Logged In */
            <>
              <a href="/login" className="btn-text" onClick={closeAll}>Log In</a>
              <a href="/register" className="btn-primary" onClick={closeAll}>Get Started</a>
            </>
          )}

          {/* Mobile Toggle */}
          <button className="mobile-toggle" onClick={toggleMobile}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`} id="mobileNav">
        {navLinks.map((link, index) => (
          <a key={index} href={link.to} onClick={closeAll}>
            {link.label}
          </a>
        ))}
        {user ? (
          <>
            <a href="/profile" onClick={closeAll}>My Profile</a>
            <a href="#" className="logout-link" onClick={handleLogout} style={{ color: '#ef4444' }}>Logout</a>
          </>
        ) : (
          <div className="mobile-auth">
            <a href="/login" onClick={closeAll}>Log In</a>
            <a href="/register" className="btn-primary" onClick={closeAll}>Register</a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
