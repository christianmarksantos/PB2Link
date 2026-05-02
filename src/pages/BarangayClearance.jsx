import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 

const API_BASE = '/api_backend';

const BarangayClearance = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [requestMode, setRequestMode] = useState('Self');
  const [trackingCode, setTrackingCode] = useState('');
  
  // Toast State
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    fName: '', mName: '', lName: '', suffix: '',
    civilStatus: '', gender: '',
    block_lot: '', houseNo: '', street: '', subdivision: '', zone: '',
    years_in_PB2: '', precinct: '', sector: '',
    purpose: '', otherPurposeText: '',
    // Beneficiary fields
    other_fname: '', other_mname: '', other_lname: '', other_suffix: '',
    other_gender: '', other_civil_status: '', other_sector: '',
    other_block_lot: '', other_houseNo: '', other_street: '', 
    other_subdivision: '', other_zone: '', other_years_in_PB2: '', 
    other_precinct: '',
    // Files
    id_front: null, id_back: null, id_holding: null
  });

  // 1. Generate Tracking Code
  useEffect(() => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTrackingCode(`CLR-${date}-${randomHash}`);
  }, []);

  // 2. Fetch Profile Data
  useEffect(() => {
  if (user?.user_id) {
    fetch(`${API_BASE}/get_user_profile.php?user_id=${user.user_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const d = data.data;
          setFormData(prev => ({
            ...prev,
            // CRITICAL: You must capture the numeric resident_id from the DB
            resident_id: d.resident_id, 
            fName: d.fName || '',
            mName: d.mName || '',
            lName: d.lName || '',
              suffix: d.suffix || 'N/A',
              civilStatus: d.civil_status || 'Single',
              gender: d.gender || '',
              block_lot: d.block_lot || '',
              houseNo: d.house_no || '',
              street: d.street || '',
              subdivision: d.subdivision || '',
              zone: d.zone || '',
              years_in_PB2: d.years_in_PB2 || '',
              precinct: d.precinct_no || 'N/A',
              sector: d.sector || 'N/A'
            }));
          }
        })
        .catch(err => console.error("Failed to fetch profile", err));
    }
  }, [user]);

  // Validation Logic
  const validateStep = () => {
    if (currentStep === 0) {
      if (requestMode === 'Self') {
        return formData.purpose && (formData.purpose !== 'Other' || formData.otherPurposeText);
      } else {
        return (
          formData.other_fname && 
          formData.other_lname && 
          formData.other_gender && 
          formData.other_civil_status && 
          formData.purpose && 
          (formData.purpose !== 'Other' || formData.otherPurposeText)
        );
      }
    }
    if (currentStep === 1) {
      if (requestMode === 'Self') return true; // Profile data is guaranteed if loaded
      return (
        formData.other_block_lot && 
        formData.other_street && 
        formData.other_subdivision && 
        formData.other_zone && 
        formData.other_years_in_PB2
      );
    }
    if (currentStep === 2) {
      return formData.id_front && formData.id_back && formData.id_holding;
    }
    return true;
  };

  // Toast Function
  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 5000);
  };

const handleSubmit = async () => {
  const data = new FormData();
  
  // This sends the internal ID (e.g., 2, 13) required by the DB
  data.append('resident_id', formData.resident_id); 
  data.append('tracking_code', trackingCode);
    data.append('request_mode', requestMode);
    data.append('purpose', formData.purpose === 'Other' ? formData.otherPurposeText : formData.purpose);

    if (requestMode === 'Self') {
        data.append('fName', formData.fName);
        data.append('mName', formData.mName);
        data.append('lName', formData.lName);
        data.append('suffix', formData.suffix);
        data.append('civil_status', formData.civilStatus);
        data.append('address', `${formData.block_lot}, ${formData.street}, ${formData.subdivision}, Zone ${formData.zone}`);
        data.append('sector', formData.sector);
        data.append('years_in_PB2', formData.years_in_PB2);
        data.append('precinct_no', formData.precinct);
        data.append('beneficiary_name', `${formData.fName} ${formData.lName}`);
    } else {
        data.append('fName', formData.other_fname);
        data.append('mName', formData.other_mname);
        data.append('lName', formData.other_lname);
        data.append('suffix', formData.other_suffix);
        data.append('civil_status', formData.other_civil_status);
        data.append('address', `${formData.other_block_lot}, ${formData.other_street}, ${formData.other_subdivision}, Zone ${formData.other_zone}`);
        data.append('sector', formData.other_sector);
        data.append('years_in_PB2', formData.other_years_in_PB2);
        data.append('precinct_no', formData.other_precinct);
        data.append('beneficiary_name', `${formData.other_fname} ${formData.other_lname}`);
    }

    data.append('id_front', formData.id_front);
    data.append('id_back', formData.id_back);
    data.append('id_holding', formData.id_holding);

    try {
        const response = await fetch(`${API_BASE}/submit_barangay_clearance.php`, {
            method: 'POST',
            body: data,
        });

        const result = await response.json();
        if (result.success) {
            showToast('Success!', result.message, 'success');
        } else {
            showToast('Error', result.message, 'error');
        }
    } catch (error) {
        showToast('Server Error', 'Invalid response from server.', 'error');
    }
};

  const steps = [
    { label: 'Identity', icon: 'bi-person-badge' },
    { label: 'Residency', icon: 'bi-geo-alt-fill' },
    { label: 'Uploads', icon: 'bi-cloud-arrow-up-fill' },
    { label: 'Review', icon: 'bi-clipboard2-check-fill' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const renderFilePreview = (fileKey, label, subLabel, iconClass) => {
    const file = formData[fileKey];
    return (
      <div className={`ep-file-upload-box ${file ? 'has-file' : ''}`} onClick={() => document.getElementById(fileKey).click()}>
        <input type="file" id={fileKey} name={fileKey} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*,application/pdf" />
        {!file ? (
          <div className="ep-upload-content">
            <i className={`bi ${iconClass} ep-upload-icon`}></i>
            <h4>{label}</h4>
            <p>{subLabel}</p>
          </div>
        ) : (
          <div className="ep-preview-container">
            <i className="bi bi-check-circle-fill ep-preview-icon"></i>
            <span className="ep-file-name">{file.name}</span>
            <span className="ep-file-change">Click to change</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      
      <style>{`
        /* --- SOPHISTICATED GLASSY WHITE THEME --- */
        .ep-page-wrapper {
          min-height: 100vh;
          background-color: #011c16;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(5, 150, 105, 0.15), transparent 40%),
            linear-gradient(180deg, #002e25 0%, #000000 100%);
          padding: 60px 20px;
          font-family: 'Poppins', sans-serif;
          color: #1e293b;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .ep-form-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-radius: 30px;
          padding: 50px;
          width: 100%;
          max-width: 900px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.8);
        }

        .ep-form-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .ep-form-header h2 {
          margin: 0 0 10px;
          font-size: 2.5rem;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: -1px;
        }
        .ep-badge-official {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf5;
          color: #059669;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid #a7f3d0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* --- STEPPER --- */
        .ep-stepper-container {
          margin-bottom: 50px;
          position: relative;
        }
        .ep-stepper {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .ep-progress-bg {
          position: absolute; top: 25px; left: 5%; width: 90%; height: 4px;
          background: #e2e8f0; z-index: -1;
        }
        .ep-progress-fill {
          position: absolute; top: 25px; left: 5%; height: 4px;
          background: #059669; z-index: -1;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 10px rgba(5, 150, 105, 0.4);
        }
        .ep-step-item {
          flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center;
        }
        .ep-step-circle {
          width: 54px; height: 54px; border-radius: 50%;
          background: #ffffff; border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          color: #94a3b8; transition: 0.4s;
        }
        .ep-step-circle i {
          font-size: 1.5rem;
          display: inline-block;
        }
        .ep-step-label {
          margin-top: 12px; font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; transition: 0.4s;
        }
        
        .ep-step-item.active .ep-step-circle {
          border-color: #059669; color: #059669;
          transform: scale(1.15); box-shadow: 0 10px 20px rgba(5, 150, 105, 0.15);
          background: #ffffff;
        }
        .ep-step-item.active .ep-step-label { color: #059669; }
        
        .ep-step-item.completed .ep-step-circle {
          background: #059669; border-color: #059669; color: #fff;
        }
        .ep-step-item.completed .ep-step-label { color: #064e3b; }

        /* --- SMART TOGGLE --- */
        .ep-toggle-wrapper { margin-bottom: 30px; }
        .ep-toggle-label { display: block; font-size: 0.9rem; color: #475569; margin-bottom: 10px; font-weight: 600; }
        .ep-toggle-container {
          display: flex; background: #f1f5f9; padding: 6px; border-radius: 100px;
          border: 1px solid #e2e8f0; position: relative; cursor: pointer;
        }
        .ep-toggle-option {
          flex: 1; text-align: center; padding: 12px; font-weight: 600; z-index: 2;
          color: #64748b; transition: 0.3s; font-size: 0.95rem;
        }
        .ep-toggle-option.active { color: #fff; }
        .ep-toggle-slider {
          position: absolute; top: 6px; bottom: 6px; left: 6px; width: calc(50% - 6px);
          background: #059669; border-radius: 100px; z-index: 1;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
        }

        /* --- INPUTS & GRIDS --- */
        .ep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .ep-full { grid-column: span 2; }
        
        .ep-input-group { position: relative; }
        .ep-input-group label {
          display: block; font-size: 0.8rem; font-weight: 600; color: #475569;
          margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;
        }
        .ep-input-group input, .ep-input-group select {
          width: 100%; padding: 16px 20px; border-radius: 14px;
          border: 1px solid #cbd5e1;
          background: rgba(255, 255, 255, 0.6); color: #0f172a;
          font-family: 'Poppins', sans-serif; font-size: 1rem;
          transition: all 0.3s; outline: none; box-sizing: border-box;
        }
        .ep-input-group input:focus, .ep-input-group select:focus {
          border-color: #059669; background: #ffffff;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
        }
        .ep-input-group input[readOnly] {
          background: #f8fafc; color: #64748b; border-style: dashed; cursor: not-allowed;
        }

        .ep-section-title {
          font-size: 1.2rem; color: #0f172a; border-bottom: 1px solid #e2e8f0;
          padding-bottom: 15px; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; font-weight: 700;
        }
        .ep-section-title i { color: #059669; }

        .ep-info-note {
          display: flex; align-items: center; gap: 15px; background: #ecfdf5;
          padding: 15px 20px; border-radius: 12px; border-left: 4px solid #059669; margin-top: 20px;
        }
        .ep-info-note i { font-size: 1.5rem; color: #059669; }
        .ep-info-note p { margin: 0; font-size: 0.9rem; color: #334155; }

        /* --- FILE UPLOADS --- */
        .ep-file-upload-box {
          border: 2px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px;
          text-align: center; cursor: pointer; transition: 0.3s; background: rgba(255, 255, 255, 0.5);
        }
        .ep-file-upload-box:hover { border-color: #059669; background: #ecfdf5; }
        .ep-file-upload-box.has-file { border-color: #059669; border-style: solid; background: #ecfdf5; }
        
        .ep-upload-content h4 { margin: 15px 0 5px; color: #0f172a; font-size: 1.1rem; }
        .ep-upload-content p { margin: 0; color: #64748b; font-size: 0.85rem; }
        .ep-upload-icon { font-size: 3rem; color: #94a3b8; transition: 0.3s; }

       /* REVIEW BOX STYLING (To match Image) */
        .ep-review-box { background: #ffffff; border-radius: 10px; padding: 20px; }
        .ep-review-category { margin-top: 25px; }
        .ep-review-category:first-child { margin-top: 0; }
        .ep-review-category h5 { color: #059669; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; letter-spacing: 0.5px; }
        .ep-review-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #f1f5f9; }
        .ep-review-label { color: #64748b; font-size: 0.9rem; }
        .ep-review-val { color: #0f172a; font-weight: 700; font-size: 0.95rem; text-align: right; }
        .ep-review-val.highlight { color: #d97706; font-family: monospace; }
        .ep-attachment-tag { display: inline-flex; align-items: center; gap: 5px; background: #f0f9ff; color: #0369a1; padding: 4px 12px; border-radius: 50px; font-size: 0.8rem; border: 1px solid #bae6fd; margin-right: 8px; }

        /* --- BUTTONS --- */
        .ep-actions { display: flex; justify-content: space-between; margin-top: 50px; }
        .ep-btn {
          padding: 16px 35px; border-radius: 14px; font-weight: 700; font-size: 1.05rem;
          border: none; cursor: pointer; display: flex; align-items: center; gap: 10px;
          transition: 0.3s; font-family: 'Poppins'; text-transform: uppercase; letter-spacing: 1px;
        }
        .ep-btn-prev { background: #f1f5f9; color: #475569; }
        .ep-btn-prev:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .ep-btn-next { background: #059669; color: white; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3); }
        .ep-btn-next:hover:not(:disabled) { background: #047857; transform: translateY(-3px); }
        .ep-btn-next:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }

        /* --- TOAST --- */
        .ep-toast {
          position: fixed; top: 30px; right: 30px; z-index: 9999;
          background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
          border-left: 5px solid #059669; padding: 20px 25px; border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;
          display: flex; gap: 15px; align-items: center;
          animation: slideInRight 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .ep-toast-icon { font-size: 1.8rem; color: #059669; }

        .slide-in { animation: fadeSlideUp 0.5s ease forwards; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 768px) {
          .ep-form-card { padding: 30px 20px; }
          .ep-grid { grid-template-columns: 1fr; }
          .ep-full { grid-column: span 1; }
          .ep-step-label { display: none; }
          .ep-review-row { flex-direction: column; align-items: flex-start; gap: 5px; }
          .ep-review-val { text-align: left; }
        }
      `}</style>

      {toast && (
        <div className="ep-toast">
          <i className="bi bi-check-circle-fill ep-toast-icon"></i>
          <div>
            <h4>{toast.title}</h4>
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      <div className="ep-page-wrapper">
        <div className="ep-form-card">
          <div className="ep-form-header">
            <h2>Barangay Clearance</h2>
            <div className="ep-badge-official"><i className="bi bi-shield-check"></i> Official Document Portal</div>
          </div>

          <div className="ep-stepper-container">
            <div className="ep-stepper">
              <div className="ep-progress-bg"></div>
              <div className="ep-progress-fill" style={{ width: `${(currentStep / (steps.length - 1)) * 90 + 5}%` }}></div>
              {steps.map((step, idx) => (
                <div key={idx} className={`ep-step-item ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}>
                  <div className="ep-step-circle"><i className={`bi ${step.icon}`}></i></div>
                  <div className="ep-step-label">{step.label}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {/* STEP 1: IDENTITY */}
            {currentStep === 0 && (
              <div className="slide-in">
                <div className="ep-toggle-wrapper">
                  <span className="ep-toggle-label">Who is this request for?</span>
                  <div className="ep-toggle-container" onClick={() => setRequestMode(requestMode === 'Self' ? 'Others' : 'Self')}>
                    <div className={`ep-toggle-option ${requestMode === 'Self' ? 'active' : ''}`}>Myself</div>
                    <div className={`ep-toggle-option ${requestMode === 'Others' ? 'active' : ''}`}>Someone Else</div>
                    <div className="ep-toggle-slider" style={{ transform: requestMode === 'Self' ? 'translateX(0)' : 'translateX(100%)' }}></div>
                  </div>
                </div>

                {requestMode === 'Self' ? (
                  <div className="slide-in">
                    <h4 className="ep-section-title"><i className="bi bi-person-bounding-box"></i> Your Information</h4>
                    <div className="ep-grid">
                      <div className="ep-input-group"><label>First Name</label><input type="text" value={formData.fName} readOnly /></div>
                      <div className="ep-input-group"><label>Middle Name</label><input type="text" value={formData.mName} readOnly /></div>
                      <div className="ep-input-group"><label>Last Name</label><input type="text" value={formData.lName} readOnly /></div>
                      <div className="ep-input-group"><label>Suffix</label><input type="text" value={formData.suffix} readOnly /></div>
                      <div className="ep-input-group"><label>Civil Status</label><input type="text" value={formData.civilStatus} readOnly /></div>
                      <div className="ep-input-group"><label>Sector</label><input type="text" value={formData.sector} readOnly /></div>
                    </div>
                  </div>
                ) : (
                  <div className="slide-in">
                    <h4 className="ep-section-title"><i className="bi bi-person-add"></i> Beneficiary Details</h4>
                    <div className="ep-grid">
                      <div className="ep-input-group"><label>First Name *</label><input type="text" name="other_fname" value={formData.other_fname} onChange={handleInputChange} placeholder="Enter First Name" /></div>
                      <div className="ep-input-group"><label>Middle Name</label><input type="text" name="other_mname" value={formData.other_mname} onChange={handleInputChange} placeholder="Enter Middle Name" /></div>
                      <div className="ep-input-group"><label>Last Name *</label><input type="text" name="other_lname" value={formData.other_lname} onChange={handleInputChange} placeholder="Enter Last Name" /></div>
                      <div className="ep-input-group"><label>Suffix</label><input type="text" name="other_suffix" value={formData.other_suffix} onChange={handleInputChange} placeholder="Suffix" /></div>
                      <div className="ep-input-group">
                        <label>Gender *</label>
                        <select name="other_gender" value={formData.other_gender} onChange={handleInputChange}>
                          <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="ep-input-group">
                        <label>Civil Status *</label>
                        <select name="other_civil_status" value={formData.other_civil_status} onChange={handleInputChange}>
                          <option value="">Select Status</option><option value="Single">Single</option><option value="Married">Married</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ep-grid" style={{ marginTop: '30px' }}>
                  <div className="ep-input-group ep-full">
                    <label>Purpose of Request *</label>
                    <select name="purpose" value={formData.purpose} onChange={handleInputChange}>
                      <option value="">Select Official Purpose</option>
                      <option value="Employment">Employment</option>
                      <option value="Postal ID">Postal ID Requirement</option>
                      <option value="NBI Clearance">NBI Clearance</option>
                      <option value="Police Clearance">Police Clearance</option>
                      <option value="Bank Account">Opening Bank Account</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.purpose === 'Other' && (
                    <div className="ep-input-group ep-full slide-in">
                      <label>Please Specify Purpose *</label>
                      <input type="text" name="otherPurposeText" value={formData.otherPurposeText} onChange={handleInputChange} placeholder="Enter specific purpose" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: RESIDENCY */}
            {currentStep === 1 && (
              <div className="slide-in">
                <h4 className="ep-section-title"><i className="bi bi-house-door"></i> Address Verification</h4>
                <div className="ep-grid">
                  {requestMode === 'Self' ? (
                    <>
                      <div className="ep-input-group ep-full">
                        <label>Registered Address</label>
                        <input type="text" value={`${formData.block_lot}, ${formData.street}, ${formData.subdivision}, Zone ${formData.zone}`} readOnly />
                      </div>
                      <div className="ep-input-group"><label>Years of Residency</label><input type="text" value={formData.years_in_PB2} readOnly /></div>
                      <div className="ep-input-group"><label>Precinct No.</label><input type="text" value={formData.precinct} readOnly /></div>
                    </>
                  ) : (
                    <>
                      <div className="ep-input-group"><label>Block/Lot *</label><input type="text" name="other_block_lot" value={formData.other_block_lot} onChange={handleInputChange} placeholder="Blk 1 Lot 2" /></div>
                      <div className="ep-input-group"><label>Street *</label><input type="text" name="other_street" value={formData.other_street} onChange={handleInputChange} placeholder="Street Name" /></div>
                      <div className="ep-input-group"><label>Subdivision *</label><input type="text" name="other_subdivision" value={formData.other_subdivision} onChange={handleInputChange} placeholder="Subdivision Name" /></div>
                      <div className="ep-input-group"><label>Zone *</label><input type="text" name="other_zone" value={formData.other_zone} onChange={handleInputChange} placeholder="Zone No." /></div>
                      <div className="ep-input-group"><label>Years of Residency *</label><input type="text" name="other_years_in_PB2" value={formData.other_years_in_PB2} onChange={handleInputChange} placeholder="Ex: 5" /></div>
                      <div className="ep-input-group"><label>Precinct No. (Optional)</label><input type="text" name="other_precinct" value={formData.other_precinct} onChange={handleInputChange} placeholder="Precinct No." /></div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: UPLOADS */}
            {currentStep === 2 && (
              <div className="slide-in">
                <h4 className="ep-section-title"><i className="bi bi-file-earmark-lock"></i> Required Documents</h4>
                <div className="ep-grid">
                  {renderFilePreview('id_front', 'Valid ID (Front)', 'Upload clear image', 'bi-front')}
                  {renderFilePreview('id_back', 'Valid ID (Back)', 'Must show address', 'bi-back')}
                  <div className="ep-full">
                    {renderFilePreview('id_holding', 
                      requestMode === 'Self' ? 'Verification Selfie' : 'Authorization Letter', 
                      requestMode === 'Self' ? 'Hold ID near your face clearly' : 'Signed letter with ID', 
                      'bi-person-video2')}
                  </div>
                </div>
              </div>
            )}

             {/* STEP 4: REVIEW (MATCHED TO SCREENSHOT) */}
            {currentStep === 3 && (
              <div className="slide-in">
                <div className="ep-review-box">
                  <h4 className="ep-section-title" style={{ border: 'none', marginBottom: '5px' }}>
                    <i className="bi bi-file-earmark-text text-success me-2"></i> Review & Submit Request
                  </h4>
                  
                  <div className="ep-review-category">
                    <h5>System Details</h5>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Tracking Number</span>
                      <span className="ep-review-val highlight">{trackingCode}</span>
                    </div>
                  </div>

                  <div className="ep-review-category">
                    <h5>Identity Details</h5>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Full Name</span>
                      <span className="ep-review-val">
                        {requestMode === 'Self' 
                          ? `${formData.fName} ${formData.mName} ${formData.lName} ${formData.suffix !== 'N/A' ? formData.suffix : ''}`.toUpperCase() 
                          : `${formData.other_fname} ${formData.other_mname} ${formData.other_lname} ${formData.other_suffix}`.toUpperCase()}
                      </span>
                    </div>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Civil Status</span>
                      <span className="ep-review-val">{requestMode === 'Self' ? formData.civilStatus : formData.other_civil_status}</span>
                    </div>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Request For</span>
                      <span className="ep-review-val">{requestMode === 'Self' ? 'Myself (Account Holder)' : 'Someone Else'}</span>
                    </div>
                  </div>

                  <div className="ep-review-category">
                    <h5>Location & Group</h5>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Complete Address</span>
                      <span className="ep-review-val">
                        {requestMode === 'Self' 
                          ? `${formData.block_lot}, ${formData.street}, ${formData.subdivision}, Zone ${formData.zone}` 
                          : `${formData.other_block_lot}, ${formData.other_street}, ${formData.other_subdivision}, Zone ${formData.other_zone}`}
                      </span>
                    </div>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Years in Barangay</span>
                      <span className="ep-review-val">{requestMode === 'Self' ? formData.years_in_PB2 : formData.other_years_in_PB2}</span>
                    </div>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Special Sector</span>
                      <span className="ep-review-val">{requestMode === 'Self' ? (formData.sector || 'None') : (formData.other_sector || 'None')}</span>
                    </div>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Precinct Number</span>
                      <span className="ep-review-val">{requestMode === 'Self' ? (formData.precinct || 'Not Provided') : (formData.other_precinct || 'Not Provided')}</span>
                    </div>
                  </div>

                  <div className="ep-review-category">
                    <h5>Request Purpose</h5>
                    <div className="ep-review-row">
                      <span className="ep-review-label">Main Purpose</span>
                      <span className="ep-review-val">{formData.purpose === 'Other' ? formData.otherPurposeText : formData.purpose}</span>
                    </div>
                  </div>

                  <div className="ep-review-category">
                    <h5>Attachments Summary</h5>
                    <div className="mt-2">
                      <span className="ep-attachment-tag"><i className="bi bi-paperclip"></i> ID Front Image</span>
                      <span className="ep-attachment-tag"><i className="bi bi-paperclip"></i> ID Back Image</span>
                      <span className="ep-attachment-tag">
                        <i className="bi bi-paperclip"></i> {requestMode === 'Self' ? 'Verification Selfie' : 'Authorization Letter'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            <div className="ep-actions">
              <button type="button" className="ep-btn ep-btn-prev" disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>
                <i className="bi bi-arrow-left"></i> Back
              </button>
              <button 
                type="button" 
                className="ep-btn ep-btn-next" 
                disabled={!validateStep()}
                onClick={() => currentStep === 3 ? handleSubmit() : setCurrentStep(currentStep + 1)}
              >
                {currentStep === 3 ? 'Confirm & Submit' : 'Continue'} <i className={currentStep === 3 ? "bi bi-send-fill" : "bi bi-arrow-right"}></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BarangayClearance;
