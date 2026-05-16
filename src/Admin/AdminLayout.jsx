import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'; // 1. Added Outlet here
import './admin_style.css';

// 2. Removed 'children' from props because Outlet handles it now
const AdminLayout = ({ adminName = "AdminJaze" }) => { 
  const location = useLocation();
  const navigate = useNavigate();
  const cp = location.pathname;

  return (
    <div className="admin-wrapper">
      {/* --- SIDEBAR --- */}
      <nav className="admin-sidebar">
        <div className="brand-section">
          <h4>
            <i className="fas fa-leaf" style={{ color: '#ffaa17', marginRight: '10px' }}></i> 
            PB2 ADMIN
          </h4>
        </div>

        <div className="nav-links-container" style={{ marginTop: '20px' }}>
          {/* Matches path="dashboard" in App.jsx */}
          <Link to="/admin/dashboard" className={`nav-link ${cp.includes('dashboard') ? 'active' : ''}`}>
            <i className="fas fa-th-large"></i> Dashboard
          </Link>

          <Link to="/admin/profiling" className={`nav-link ${cp.includes('profiling') ? 'active' : ''}`}>
            <i className="fas fa-users"></i> Profiling
          </Link>

          <Link to="/admin/documents" className={`nav-link ${cp.includes('documents') ? 'active' : ''}`}>
            <i className="fas fa-file-contract"></i> Documents
          </Link>

          <Link to="/admin/incidents" className={`nav-link ${cp.includes('incidents') ? 'active' : ''}`}>
            <i className="fas fa-exclamation-triangle"></i> Incident
          </Link>

          {/* Matches path="amenities" in App.jsx */}
          <Link to="/admin/amenities" className={`nav-link ${cp.includes('amenities') ? 'active' : ''}`}>
            <i className="fas fa-swimming-pool"></i> Amenities
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '90%', padding: '0 20px' }}>
          <button onClick={() => navigate('/login')} className="btn-logout-custom">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      {/* --- TOP HEADER --- */}
      <header className="top-header">
        <div className="header-title">
          <h5 style={{ margin: 0, fontWeight: 700, color: '#043927' }}>
            {cp.includes('dashboard') ? "Dashboard Overview" : 
             cp.includes('profiling') ? "Resident Profiling" : 
             cp.includes('documents') ? "Document Requests" : 
             cp.includes('incidents') ? "Incident Reports" : 
             cp.includes('amenities') ? "Amenities Management" : "Admin Panel"}
          </h5>
        </div>
        
        <div className="admin-profile-section" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', marginRight: '12px' }}>{adminName}</span>
          <div className="avatar-circle">
            <i className="fas fa-user"></i>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        {/* 3. THIS IS THE MAGIC FIX: Outlet is where AdminDashboard or AmenityDashboard appears */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;