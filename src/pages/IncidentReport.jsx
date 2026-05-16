import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/incident-report.css';

const API_BASE = '/api_backend';

const EMPTY_RESIDENT_DATA = {
  fullname: '',
  address: '',
  contact_num: '',
  email: '',
};

const buildFullName = (resident) => [
  resident.fName,
  resident.mName,
  resident.lName,
  resident.suffix && resident.suffix !== 'N/A' ? resident.suffix : '',
].filter(Boolean).join(' ');

const buildAddress = (resident) => [
  resident.house_no,
  resident.street,
  resident.subdivision,
  resident.zone ? `Zone ${resident.zone}` : '',
].filter(Boolean).join(', ');

const normalizeResidentData = (profile = {}) => ({
  ...EMPTY_RESIDENT_DATA,
  ...profile,
  fullname: profile.fullname || buildFullName(profile),
  address: profile.address || buildAddress(profile),
  contact_num: profile.contact_num || '',
  email: profile.email || '',
});

const IncidentReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState({ show: false, title: '', msg: '', type: 'success' });

  const [residentData, setResidentData] = useState(EMPTY_RESIDENT_DATA);

  const [formData, setFormData] = useState({
    contact_person_name: '',
    contact_person_number: '',
    incident_address: '',
    description: '',
    incident_class: '',
    reporting_class: '',
    attachment: null,
  });

  const triggerToast = (title, msg, type = 'success') => {
    setToast({ show: true, title, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  useEffect(() => {
    // Generate Tracking Code
    const code = `INC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
    setTrackingCode(code);

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchResidentData = async () => {
      try {
        const userId = user.user_id || localStorage.getItem('user_id');
        const response = await fetch(`${API_BASE}/get_user_profile.php?user_id=${userId}`);
        const data = await response.json();
        if (data.success) {
          const resident = normalizeResidentData(data.resident || data.data);

          setResidentData(resident);
          // Auto-fill incident defaults with resident info
          setFormData(prev => ({
            ...prev,
            incident_address: resident.address,
          }));
        }
      } catch (err) {
        console.error(err);
        triggerToast('Error', 'Failed to load profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchResidentData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        triggerToast('Login Required', 'Please log in to submit a report.', 'error');
        return;
    }

    const missingReporterInfo = !residentData.fullname || !residentData.address || !residentData.contact_num || !residentData.email;
    if (missingReporterInfo) {
        triggerToast('Incomplete Profile', 'Your registered name, contact number, address, and email are required before submitting.', 'error');
        return;
    }

    const missingIncidentInfo = Object.entries(formData).some(([, value]) => !value);
    if (missingIncidentInfo) {
        triggerToast('Incomplete Report', 'Please complete all incident fields and add an evidence attachment.', 'error');
        return;
    }

    setSubmitting(true);
    const dataToSend = new FormData();
    
    // 1. Append Incident Details (The stuff from the form inputs)
    Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
            dataToSend.append(key, formData[key]);
        }
    });

    // 2. Append Metadata
    dataToSend.append('user_id', user.user_id || localStorage.getItem('user_id'));
    dataToSend.append('track_code', trackingCode);

    // 3. Append Reporter Details (The "Hidden" fields the backend needs)
    dataToSend.append('reporter_name', residentData.fullname);
    dataToSend.append('reporter_address', residentData.address);
    dataToSend.append('reporter_contact', residentData.contact_num);
    dataToSend.append('reporter_email', residentData.email);

    try {
      const response = await fetch(`${API_BASE}/report_incident.php`, {
        method: 'POST',
        body: dataToSend,
      });
      const res = await response.json();
      if (res.success) setShowSuccessModal(true);
      else triggerToast('Error', res.message, 'error');
    } catch (err) {
      console.error(err);
      triggerToast('Network Error', 'Could not connect to server.', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <div className="incident-page" style={{textAlign:'center', padding: '50px'}}>Loading Form...</div>;

  return (
    <>
      <Header />

      {toast.show && (
        <div className="toast-container">
            <div className={`toast-box ${toast.type === 'error' ? 'error' : ''}`} style={{ opacity: 1, transform: 'translateX(0)' }}>
                <div className="toast-content">
                    <h4>{toast.title}</h4>
                    <p>{toast.msg}</p>
                </div>
                <div className="toast-close" onClick={() => setToast({ ...toast, show: false })}>&times;</div>
            </div>
        </div>
      )}

      <div className="incident-page">
        <div className="incident-container">
          <div className="incident-card">
            
            <div className="incident-header">
              <h1>Incident Report Form</h1>
              <p>Help us keep Barangay Pasong Buaya II safe</p>
            </div>

            <div className="incident-body">
              
              <div className="incident-notice">
                <strong>For emergency contact:</strong><br />
                Barangay Pasong Buaya 2 Response Team<br />
                📱 Mobile: <strong>0917 157 1889</strong><br />
                ☎ Hotline: <strong>(046) 502 4058</strong>
                <p style={{marginTop: '10px', fontSize: '0.75rem', opacity: 0.7}}>
                   {user ? "Please ensure all details are accurate before submitting." : "You are currently in view-only mode. Please login to submit."}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                
                {/* SECTION 1: REPORTER */}
                <div className="section-header">
                  <div className="badge">01</div>
                  <div className="title">Reporter Information</div>
                </div>

                <div className="input-grid">
                  <div className="form-group span-2">
                    <label>Full Name</label>
                    <input type="text" required value={residentData.fullname} readOnly placeholder="Log in to view" />
                  </div>
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input type="text" required value={residentData.contact_num} readOnly placeholder="N/A" />
                  </div>
                  <div className="form-group span-2">
                    <label>Address</label>
                    <input type="text" required value={residentData.address} readOnly placeholder="N/A" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" required value={residentData.email} readOnly placeholder="N/A" />
                  </div>
                </div>

                {/* SECTION 2: INCIDENT DETAILS */}
                <div className="section-header">
                  <div className="badge">02</div>
                  <div className="title">Incident Details</div>
                </div>

                <div className="input-grid">
                  <div className="form-group">
                    <label>Tracking Code</label>
                    <input type="text" value={trackingCode} readOnly style={{fontWeight: '800', color: '#064e3b'}} />
                  </div>
                  <div className="form-group">
                    <label>Person Involved</label>
                    <input type="text" required value={formData.contact_person_name} 
                      onChange={(e) => setFormData({...formData, contact_person_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Involved Contact #</label>
                    <input type="text" required value={formData.contact_person_number}
                      onChange={(e) => setFormData({...formData, contact_person_number: e.target.value})} />
                  </div>
                  
                  <div className="form-group span-3">
                    <label>Incident Address / Landmark</label>
                    <input type="text" required value={formData.incident_address}
                      onChange={(e) => setFormData({...formData, incident_address: e.target.value})} />
                  </div>

                  <div className="form-group span-2">
                    <label>Classification</label>
                    <select required value={formData.incident_class} onChange={(e) => setFormData({...formData, incident_class: e.target.value})}>
                      <option value="">-- Select Category --</option>
                      <option value="Health & Safety">Health & Safety</option>
                      <option value="Security">Security</option>
                      <option value="Environmental & Infrastructure">Environmental & Infrastructure</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reporting Type</label>
                    <select required value={formData.reporting_class} onChange={(e) => setFormData({...formData, reporting_class: e.target.value})}>
                      <option value="">-- Select Type --</option>
                      <option value="Accident Report">Accident Report</option>
                      <option value="Near Miss Report">Near Miss Report</option>
                      <option value="Hazard Report">Hazard Report</option>
                    </select>
                  </div>

                  <div className="form-group span-3">
                    <label>Detailed Description</label>
                    <textarea required value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Please describe the events clearly..."></textarea>
                  </div>

                  <div className="form-group span-3">
                    <label>Evidence Attachment</label>
                    <div className="file-input-wrapper">
                      <input type="file" required accept=".jpg,.jpeg,.png,.mp4" 
                        onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})} />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Sending Report..." : "Submit Incident Report"}
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="modal-overlay" style={{display:'flex', position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center', zIndex:1000}}>
          <div style={{background:'white', padding:'40px', borderRadius:'8px', maxWidth:'500px', textAlign:'center', borderTop:'8px solid #064e3b'}}>
            <h2 style={{color:'#064e3b'}}>✓ SUBMITTED</h2>
            <p>Your report has been recorded.</p>
            <div style={{background:'#f1f5f9', padding:'15px', margin:'20px 0', fontWeight:'800', letterSpacing:'1px'}}>
              {trackingCode}
            </div>
            <button onClick={() => navigate('/dashboard')} style={{background:'#064e3b', color:'white', border:'none', padding:'10px 20px', cursor:'pointer'}}>Continue to Dashboard</button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default IncidentReport;
