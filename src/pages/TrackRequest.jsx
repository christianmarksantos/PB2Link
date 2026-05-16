import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import '../styles/track-request.css';

const API_BASE = '/api_backend';

// Helper functions moved outside component for better performance
const getStatusColor = (status) => {
  const statusMap = {
    'pending': '#f97316',
    'approved': '#22c55e',
    'rejected': '#ef4444',
    'completed': '#3b82f6',
    'processing': '#8b5cf6'
  };
  return statusMap[status?.toLowerCase()] || '#64748b';
};

const getStatusIcon = (status) => {
  const iconMap = {
    'pending': '⏳',
    'approved': '✓',
    'rejected': '✗',
    'completed': '✔',
    'processing': '⚙'
  };
  return iconMap[status?.toLowerCase()] || '•';
};

const getProgressPercentage = (status) => {
  const progressMap = {
    'pending': 25,
    'processing': 50,
    'approved': 75,
    'completed': 100,
    'rejected': 0
  };
  return progressMap[status?.toLowerCase()] || 0;
};

const getTimelineSteps = (status, createdAt) => {
  const statusLower = status?.toLowerCase() || 'pending';
  const submittedDate = createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A';
  
  const steps = [
    { label: 'Submitted', completed: true, date: submittedDate },
    { label: 'Processing', completed: ['processing', 'approved', 'completed'].includes(statusLower) },
    { label: 'Approved', completed: ['approved', 'completed'].includes(statusLower) },
    { label: 'Ready for Pickup', completed: statusLower === 'completed' }
  ];
  return steps;
};

// RequestCard component moved outside main component
const RequestCard = React.memo(({ request, type, onViewDetails, onResubmit, onCopyTracking }) => {
  const isClearance = type === 'clearance';
  const trackingCode = request.tracking_code || request.tracking_id || 'N/A';
  const status = request.status || 'pending';
  const submittedDate = new Date(request.created_at || request.submitted_date || request.created_at).toLocaleDateString();
  const purpose = request.purpose || 'Clearance Request';
  const progress = getProgressPercentage(status);
  const timelineSteps = getTimelineSteps(status, request.created_at || request.submitted_date);
  const cardRef = useRef(null);

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <article className="request-card" ref={cardRef} tabIndex="0" aria-label={`${isClearance ? 'Barangay Clearance' : 'Incident Report'} - ${status}`}>
      <div className="card-header">
        <div className="card-title-section">
          <span className="request-type-badge" role="text">
            {isClearance ? '📋 Barangay Clearance' : '⚠️ Incident Report'}
          </span>
          <h3 className="request-title">
            {isClearance ? purpose : request.incident_type || 'Incident Report'}
          </h3>
        </div>
        <div className={`status-badge status-${status.toLowerCase()}`} style={{ borderColor: getStatusColor(status) }} role="status" aria-label={`Status: ${status}`}>
          <span className="status-icon" aria-hidden="true">{getStatusIcon(status)}</span>
          <span className="status-text">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
      </div>

      <div className="card-content">
        <div className="info-grid">
          <div className="info-item">
            <label id={`tracking-label-${trackingCode}`}>Tracking Code</label>
            <div className="tracking-code-wrapper">
              <span className="tracking-code" aria-labelledby={`tracking-label-${trackingCode}`}>{trackingCode}</span>
              <button 
                className="copy-btn"
                onClick={() => onCopyTracking(trackingCode)}
                onKeyDown={(e) => handleKeyDown(e, () => onCopyTracking(trackingCode))}
                title="Copy tracking code to clipboard"
                aria-label={`Copy tracking code ${trackingCode} to clipboard`}
                type="button"
              >
                <span aria-hidden="true">📋</span>
              </button>
            </div>
          </div>
          <div className="info-item">
            <label>Submitted</label>
            <p aria-label={`Submitted on ${submittedDate}`}>{submittedDate}</p>
          </div>
          {request.estimated_completion && (
            <div className="info-item">
              <label>Expected Completion</label>
              <p>{new Date(request.estimated_completion).toLocaleDateString()}</p>
            </div>
          )}
          {request.notes && (
            <div className="info-item full-width">
              <label>Notes from Admin</label>
              <p className="notes-text">{request.notes}</p>
            </div>
          )}
        </div>

        <div className="progress-container" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" aria-label="Request progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${progress}%`,
                backgroundColor: getStatusColor(status)
              }}
            />
          </div>
          <span className="progress-text">{progress}% Complete</span>
        </div>

        <div className="card-timeline" aria-label="Request timeline">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className={`timeline-step ${step.completed ? 'completed' : ''}`} aria-current={step.completed ? 'step' : undefined}>
              <div className="timeline-dot" aria-hidden="true"></div>
              <div className="timeline-content">
                <span className="timeline-label">{step.label}</span>
                {step.date && <span className="timeline-date">{step.date}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="btn-details"
          onClick={() => onViewDetails(request)}
          onKeyDown={(e) => handleKeyDown(e, () => onViewDetails(request))}
          aria-label={`View full details for ${isClearance ? 'clearance' : 'incident'} request ${trackingCode}`}
          type="button"
        >
          View Details
        </button>
        {status.toLowerCase() === 'rejected' && (
          <button 
            className="btn-resubmit"
            onClick={() => onResubmit(request)}
            onKeyDown={(e) => handleKeyDown(e, () => onResubmit(request))}
            aria-label={`Resubmit request ${trackingCode}`}
            type="button"
          >
            Resubmit Request
          </button>
        )}
      </div>
    </article>
  );
});

RequestCard.displayName = 'RequestCard';

const TrackRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clearance');
  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [incidentReports, setIncidentReports] = useState([]);
  const [searchTrackingCode, setSearchTrackingCode] = useState('');
  const [toast, setToast] = useState(null);
  const [filteredRequests, setFilteredRequests] = useState({ clearance: [], incident: [] });
  const searchInputRef = useRef(null);
  const mainContentRef = useRef(null);

  // Fetch request data
  const fetchRequestData = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      
      // Fetch clearance requests
      const clearanceRes = await fetch(
        `${API_BASE}/get_clearance_requests.php?user_id=${user.user_id}`
      );
      const clearanceData = await clearanceRes.json();
      if (clearanceData.success) {
        setClearanceRequests(clearanceData.data || []);
      } else {
        console.error('Failed to fetch clearance requests:', clearanceData.message);
        showToast('Failed to load clearance requests', 'error');
      }

const residencyData = await residencyRes.json();
      if (residencyData.success) {
        setResidencyRequests(residencyData.data || []);
      }

const idData = await residencyRes.json();
      if (idData.success) {
        setResidencyRequests(idData.data || []);
      }




      // Fetch incident reports
      const incidentRes = await fetch(
        `${API_BASE}/get_incident_reports.php?user_id=${user.user_id}`
      );
      const incidentData = await incidentRes.json();
      if (incidentData.success) {
        setIncidentReports(incidentData.data || []);
      } else {
        console.error('Failed to fetch incident reports:', incidentData.message);
        showToast('Failed to load incident reports', 'error');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Error loading requests. Please check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchRequestData();
  }, [user, navigate, fetchRequestData]);

  // Filter requests based on search
  useEffect(() => {
    const searchTerm = searchTrackingCode.toLowerCase().trim();
    
    if (searchTerm) {
      const filteredClearance = clearanceRequests.filter(req => 
        (req.tracking_code?.toLowerCase().includes(searchTerm) || false) ||
        (req.purpose?.toLowerCase().includes(searchTerm) || false)
      );
      const filteredIncident = incidentReports.filter(req => 
        (req.tracking_code?.toLowerCase().includes(searchTerm) || false) ||
        (req.incident_type?.toLowerCase().includes(searchTerm) || false)
      );
      setFilteredRequests({ clearance: filteredClearance, incident: filteredIncident });
    } else {
      setFilteredRequests({ clearance: clearanceRequests, incident: incidentReports });
    }
  }, [searchTrackingCode, clearanceRequests, incidentReports]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleCopyTracking = useCallback((trackingCode) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingCode).then(() => {
        showToast('Tracking code copied to clipboard!');
      }).catch(() => {
        showToast('Failed to copy tracking code', 'error');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = trackingCode;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Tracking code copied to clipboard!');
      } catch {
        showToast('Failed to copy tracking code', 'error');
      }
      document.body.removeChild(textArea);
    }
  }, [showToast]);

  const handleViewDetails = useCallback((request) => {
    showToast(`Viewing details for ${request.tracking_code || request.tracking_id}`);
  }, [showToast]);

  const handleResubmit = useCallback((request) => {
    if (request.tracking_code) {
      navigate('/request/clearance', { state: { resubmitFrom: request } });
    } else {
      navigate('/incident-report', { state: { resubmitFrom: request } });
    }
  }, [navigate]);

  const displayRequests = useMemo(() => {
    return activeTab === 'clearance' ? filteredRequests.clearance : filteredRequests.incident;
  }, [activeTab, filteredRequests]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Focus the first card or empty state after tab change
    setTimeout(() => {
      if (mainContentRef.current) {
        const firstCard = mainContentRef.current.querySelector('.request-card, .empty-state');
        if (firstCard) {
          firstCard.focus();
        }
      }
    }, 100);
  };

  const handleSearch = () => {
    if (!searchTrackingCode.trim()) {
      showToast('Please enter a tracking code', 'error');
      searchInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <>
      <Preloader />
      <Header />

      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-link" aria-label="Skip to main content">
        Skip to main content
      </a>

      <div className="track-page-background">
        {/* Hero Section */}
        <section className="track-hero-section" aria-label="Track your requests">
          <div className="hero-content">
            <span className="badge-gold" role="text">📍 Track Your Requests</span>
            <h1>Request Status Tracker</h1>
            <p style={{ color: "var(--primary-darker)" }}>
                Monitor the status of your barangay clearance applications and incident reports in real-time
            </p>
            
            <div className="search-container">
              <label htmlFor="search-tracking" className="visually-hidden">Search by tracking code</label>
              <input 
                id="search-tracking"
                type="text"
                placeholder="Enter tracking code (e.g., CLR-20260429-0Y1822)"
                value={searchTrackingCode}
                onChange={(e) => setSearchTrackingCode(e.target.value)}
                className="search-input"
                aria-label="Enter tracking code to search"
                ref={searchInputRef}
                onKeyDown={(e) => handleKeyDown(e, handleSearch)}
              />
              <button 
                className="search-btn"
                onClick={handleSearch}
                aria-label="Search for tracking code"
                type="button"
              >
                <i className="bi bi-search" aria-hidden="true"></i> Search
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="track-content-section" aria-label="Your requests">
          <div className="track-container">
            {/* Tab Navigation */}
            <div className="tab-navigation" role="tablist" aria-label="Request type tabs">
              <button 
                className={`tab-btn ${activeTab === 'clearance' ? 'active' : ''}`}
                onClick={() => handleTabChange('clearance')}
                role="tab"
                aria-selected={activeTab === 'clearance'}
                aria-controls="clearance-panel"
                id="clearance-tab"
                type="button"
              >
                <span className="tab-icon" aria-hidden="true">📋</span>
                <span>Barangay Clearance</span>
                <span className="badge-count" aria-label={`${clearanceRequests.length} clearance requests`}>{clearanceRequests.length}</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'incident' ? 'active' : ''}`}
                onClick={() => handleTabChange('incident')}
                role="tab"
                aria-selected={activeTab === 'incident'}
                aria-controls="incident-panel"
                id="incident-tab"
                type="button"
              >
                <span className="tab-icon" aria-hidden="true">⚠️</span>
                <span>Incident Reports</span>
                <span className="badge-count" aria-label={`${incidentReports.length} incident reports`}>{incidentReports.length}</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="track-content" role="tabpanel" ref={mainContentRef}>
              {loading ? (
                <div className="loading-state">
                  <div className="spinner" aria-hidden="true"></div>
                  <p>Loading your requests...</p>
                </div>
              ) : activeTab === 'clearance' ? (
                <div className="requests-grid" id="clearance-panel" role="tabpanel" aria-labelledby="clearance-tab">
                  {displayRequests.length > 0 ? (
                    displayRequests.map((request, idx) => (
                      <RequestCard 
                        key={`${request.tracking_code || idx}`} 
                        request={request} 
                        type="clearance"
                        onViewDetails={handleViewDetails}
                        onResubmit={handleResubmit}
                        onCopyTracking={handleCopyTracking}
                      />
                    ))
                  ) : searchTrackingCode ? (
                    <div className="empty-state" tabIndex="0">
                      <div className="empty-icon" aria-hidden="true">🔍</div>
                      <h3>No Results Found</h3>
                      <p>No clearance requests match your search "{searchTrackingCode}"</p>
                      <button 
                        className="btn-new-request"
                        onClick={() => {
                          setSearchTrackingCode('');
                          searchInputRef.current?.focus();
                        }}
                        type="button"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className="empty-state" tabIndex="0">
                      <div className="empty-icon" aria-hidden="true">📋</div>
                      <h3>No Clearance Requests Yet</h3>
                      <p>You haven't submitted any barangay clearance requests</p>
                      <button 
                        className="btn-new-request"
                        onClick={() => navigate('/request/clearance')}
                        type="button"
                      >
                        Request Clearance
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="requests-grid" id="incident-panel" role="tabpanel" aria-labelledby="incident-tab">
                  {displayRequests.length > 0 ? (
                    displayRequests.map((report, idx) => (
                      <RequestCard 
                        key={`${report.tracking_code || idx}`} 
                        request={report} 
                        type="incident"
                        onViewDetails={handleViewDetails}
                        onResubmit={handleResubmit}
                        onCopyTracking={handleCopyTracking}
                      />
                    ))
                  ) : searchTrackingCode ? (
                    <div className="empty-state" tabIndex="0">
                      <div className="empty-icon" aria-hidden="true">🔍</div>
                      <h3>No Results Found</h3>
                      <p>No incident reports match your search "{searchTrackingCode}"</p>
                      <button 
                        className="btn-new-request"
                        onClick={() => {
                          setSearchTrackingCode('');
                          searchInputRef.current?.focus();
                        }}
                        type="button"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className="empty-state" tabIndex="0">
                      <div className="empty-icon" aria-hidden="true">⚠️</div>
                      <h3>No Incident Reports Yet</h3>
                      <p>You haven't submitted any incident reports</p>
                      <button 
                        className="btn-new-request"
                        onClick={() => navigate('/incident-report')}
                        type="button"
                      >
                        File Incident Report
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Info Cards Section */}
        <section className="info-section" aria-label="Helpful information">
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon" aria-hidden="true">⏱️</div>
              <h3>Average Processing Time</h3>
              <p>3-5 business days</p>
            </div>
            <div className="info-card">
              <div className="info-icon" aria-hidden="true">📞</div>
              <h3>Need Help?</h3>
              <p>Contact our support team</p>
            </div>
            <div className="info-card">
              <div className="info-icon" aria-hidden="true">✉️</div>
              <h3>Email Updates</h3>
              <p>Get notified about your requests</p>
            </div>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`} role="alert" aria-live="assertive" aria-atomic="true">
          {toast.message}
        </div>
      )}

      <Footer />
    </>
  );
};

export default TrackRequest;