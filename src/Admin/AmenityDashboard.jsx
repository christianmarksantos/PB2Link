import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = '/api_backend';

const AmenityDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const navigate = useNavigate();

  const fetchReservations = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/get_amenities.php`);
      if (Array.isArray(response.data)) {
        setRequests(response.data);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await axios.post(`${API_BASE}/update_amenity.php`, {
        request_id: id,
        status: newStatus // This will now send "Declined" or "Claimed"
      });
      if (response.data.success) {
        fetchReservations();
      } else {
        console.error("Server Error:", response.data.error);
      }
    } catch (error) { console.error("Update failed:", error); }
  };

  const filteredData = requests.filter(req => {
    // Show only the "finished" or "rejected" bookings in Archive
    if (activeTab === 'archived') {
        return req.status === 'Declined' || req.status === 'Completed' || req.status === 'Cancelled';
    }
    // Show active and upcoming bookings in the main tab
    return req.status === 'Pending' || req.status === 'Approved';
  });

  return (
    <div className="premium-page-container">
      <style>{`
        .premium-page-container { width: 100%; min-height: 100vh; padding: 40px; background: #f8fafc; box-sizing: border-box; }
        .header-content { margin-bottom: 30px; text-align: left; }
        .page-title { font-size: 2rem; font-weight: 800; color: #043927; margin: 0; }
        .sub-text { color: #64748b; font-size: 1rem; }
        .tab-bar { display: flex; gap: 15px; margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .tab-item { padding: 10px 25px; border: none; background: none; cursor: pointer; font-weight: 700; color: #94a3b8; transition: 0.3s; border-radius: 8px; }
        .tab-item.active { background: #043927; color: #fff; }
        .glass-table-card { background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; overflow: hidden; }
        .amenity-table { width: 100%; border-collapse: collapse; text-align: left; }
        .amenity-table th { background: #f1f5f9; padding: 18px 25px; color: #475569; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        .amenity-table td { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; background: white; }
        .status-tag { padding: 6px 14px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
        .tag-pending { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .tag-approved { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .tag-rejected { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .tag-archived { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
        .action-flex { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-base { padding: 8px 16px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; transition: 0.2s; }
        .btn-view { background: #e0f2fe; color: #0369a1; }
        .btn-approve { background: #043927; color: white; }
        .btn-reject { background: white; color: #64748b; border: 1px solid #e2e8f0; }
        .btn-base:hover { transform: translateY(-2px); opacity: 0.9; }
      `}</style>
      <div className="tab-bar">
        <button className={`tab-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Requests</button>
        <button className={`tab-item ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>Archive / History</button>
      </div>

      <div className="glass-table-card">
        <table className="amenity-table">
          <thead>
            <tr>
              <th>Resident</th>
              <th>Venue & Schedule</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((req) => (
              <tr key={req.request_id}>
                <td>{req.name || req.contact_name}</td>
                <td>{req.venue} <br/> <small>{req.reservation_date}</small></td>
                <td>
                  <span className={`status-tag tag-${req.status?.toLowerCase().replace(/\s/g, '-')}`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  <div className="action-flex">
                    {/* VIEW BUTTON */}
                    <button className="btn-base btn-view" onClick={() => navigate(`/admin/amenities/view/${req.request_id}`)}>View</button>
                    
                    {req.status === 'Pending' && activeTab === 'active' && (
                      <>
                        <button 
                          className="btn-base btn-approve" 
                          onClick={() => handleStatusUpdate(req.request_id, 'Approved')}
                        >
                          Approve Booking
                        </button>
                        <button 
                          className="btn-base btn-reject" 
                          onClick={() => handleStatusUpdate(req.request_id, 'Declined')}
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {req.status === 'Approved' && (
                      <button 
                        className="btn-base btn-view" 
                        style={{background: '#043927', color: 'white'}}
                        onClick={() => handleStatusUpdate(req.request_id, 'Completed')}
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AmenityDashboard;