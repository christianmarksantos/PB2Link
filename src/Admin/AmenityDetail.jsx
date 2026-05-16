import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = '/api_backend';

const AmenityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE}/get_amenity_details.php?id=${id}`);
        setData(response.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;
  if (!data) return <div style={{ padding: '40px' }}>Record not found.</div>;

  return (
    <div className="detail-page-wrapper">
      <style>{`
        .detail-page-wrapper {
          width: 100%;
          padding: 20px 40px;
          box-sizing: border-box;
          margin-top:-300px;
        }

        .back-nav {
          margin-bottom: 20px;
          cursor: pointer;
          color: #64748b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: none;
        }

        .landscape-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          width: 100%; /* Forces the card to stretch */
          overflow: hidden;
          
        }

        .card-top {
          padding: 30px 40px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .grid-info {
          display: grid;
          grid-template-columns: repeat(4, 1fr); /* 4 columns across the screen */
          padding: 40px;
          gap: 30px;
        }

        .data-box label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }

        .data-box p {
          font-size: 1.1rem;
          color: #043927;
          font-weight: 700;
          margin: 0;
        }

        .status-pill-large {
          padding: 8px 20px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 800;
          background: #f1f5f9;
        }
          
        .remarks-section {
          grid-column: span 4;
          background: #f8fafc;
          padding: 25px;
          border-radius: 15px;
          border: 1px solid #edf2f7;
        }
      `}</style>

      <button className="back-nav" onClick={() => navigate(-1)}>
        ← Return to Dashboard
      </button>

      <div className="landscape-card">
        <div className="card-top">
          <div>
            <h1 style={{ margin: 0, color: '#043927', fontSize: '1.8rem' }}>Reservation Case File</h1>
            <span style={{ color: '#94a3b8' }}>Tracking Number: AMN-{id}</span>
          </div>
          <div className="status-pill-large">
            {data.status}
          </div>
        </div>

        <div className="grid-info">
          {/* Row 1 */}
          <div className="data-box">
            <label>Resident Name</label>
            <p>{data.name || data.contact_name}</p>
          </div>

          <div className="data-box">
            <label>Venue / Facility</label>
            <p>{data.venue}</p>
          </div>

          <div className="data-box">
            <label>Reservation Date</label>
            <p>{data.reservation_date}</p>
          </div>

          <div className="data-box">
            <label>Time Slot</label>
            <p>{data.time_slot}</p>
          </div>

          {/* Row 2 - Notes */}
          <div className="remarks-section">
            <label style={{display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, marginBottom: '10px'}}>PURPOSE / ADMIN REMARKS</label>
            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>
                {data.purpose || "No additional remarks were provided for this specific amenity reservation."}
            </p>
          </div>
          
          <div className="data-box">
            <label>Date Filed</label>
            <p>{data.created_at || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmenityDetail;