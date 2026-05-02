import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import '../styles/services.css';

const API_BASE = '/api_backend';

const Register = () => {
  const [formData, setFormData] = useState({
    // Account Information
    email: '',
    password: '',
    confirmPassword: '',
    
    // Personal Information
    fName: '',
    mName: '',
    lName: '',
    suffix: '',
    birth_date: '',
    gender: '',
    height: '',
    contact_num: '',
    civil_status: 'Single',
    spouse_name_text: '',
    blood_type: '',
    religion: '',
    
    // Birth Place
    birth_city: '',
    birth_province: '',
    birth_country: 'Philippines',
    
    // Address
    house_no: '',
    street: '',
    zone: '',
    subdivision: '',
    area: '',
    block_lot: '',
    landmark: '',
    years_in_PB2: '1',
    residency_status: 'Homeowner',
    
    // Emergency Contact
    contact_person: '',
    contactp_num: '',
    contactp_relationship: '',
    
    // Smart Indicators / Sectoral Flags
    philsys_nat_id: '',
    valid_id: '',
    is_senior: false,
    is_pwd: false,
    is_4ps: false,
    is_solo_parent: false,
    is_indigent: false,
    privacy_agreed: false
  });

  const [files, setFiles] = useState({
    valid_id_img_front: null,
    valid_id_img_back: null,
    valid_id_img_holding: null,
    proof_pwd: null,
    proof_4ps: null,
    proof_solo_parent: null,
    proof_indigent: null
  });

  const [age, setAge] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Real-time Validation States
  const [validations, setValidations] = useState({
    email: null,
    password: null,
    match: null,
    mobile: null
  });

  // Real-time Age Calculation & Senior Detection
  useEffect(() => {
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
      // Auto-toggle senior status if age is 60+
      setFormData(prev => ({ ...prev, is_senior: calculatedAge >= 60 }));
    }
  }, [formData.birth_date]);

  // Real-time Input Validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const mobileRegex = /^09\d{9}$/;

    setValidations({
      email: formData.email === '' ? null : emailRegex.test(formData.email),
      password: formData.password === '' ? null : passRegex.test(formData.password),
      match: formData.confirmPassword === '' ? null : formData.password === formData.confirmPassword,
      mobile: formData.contact_num === '' ? null : mobileRegex.test(formData.contact_num)
    });
  }, [formData.email, formData.password, formData.confirmPassword, formData.contact_num]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.privacy_agreed) {
      setError('Regulatory Requirement: You must accept the Data Privacy Statement.');
      return;
    }

    if (validations.email === false || validations.password === false || validations.match === false || validations.mobile === false) {
      setError('Validation Error: Please correct the red-marked fields before submission.');
      return;
    }

    // Comprehensive Sectoral Validation
    if (formData.is_pwd && !files.proof_pwd) { setError('Official documentation required for PWD status.'); return; }
    if (formData.is_4ps && !files.proof_4ps) { setError('Official documentation required for 4Ps membership.'); return; }
    if (formData.is_solo_parent && !files.proof_solo_parent) { setError('Official documentation required for Solo Parent status.'); return; }
    if (formData.is_indigent && !files.proof_indigent) { setError('Official documentation required for Indigency status.'); return; }

    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => dataToSend.append(key, formData[key]));
    Object.keys(files).forEach(key => { if (files[key]) dataToSend.append(key, files[key]); });

    try {
      const response = await fetch(`${API_BASE}/register.php`, {
        method: 'POST',
        body: dataToSend,
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Official Record Created: Your profiling data is now pending verification.');
        window.scrollTo(0, 0);
        setTimeout(() => navigate('/login'), 5000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection Failure: Unable to synchronize with the BIMS main server.');
    }
  };

  return (
    <>
    <Preloader />
    <Header />
    <div className="reg-page-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        
        .reg-page-container {
          min-height: 100vh;
          background-color: #f1f5f9;
          font-family: 'Poppins', sans-serif;
          padding: 80px 20px;
          color: #1e293b;
        }

        .reg-wrapper { max-width: 1100px; margin: 0 auto; position: relative; z-index: 10; }

        .reg-card {
          background: #ffffff;
          border-radius: 4px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-top: 8px solid #064e3b;
          overflow: hidden;
        }

        .reg-header {
          background: #f8fafc;
          padding: 50px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }

        .reg-header h2 { font-size: 1.8rem; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
        .reg-header p { font-size: 0.9rem; color: #64748b; margin-top: 12px; font-weight: 500; }

        .reg-body { padding: 60px; }

        .section-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin: 60px 0 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #064e3b;
        }

        .section-header:first-child { margin-top: 0; }

        .badge {
          background: #064e3b; color: #ffffff;
          min-width: 35px; height: 35px;
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9rem;
        }

        .title { font-weight: 800; color: #064e3b; text-transform: uppercase; font-size: 1rem; letter-spacing: 1.5px; }

        .input-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }

        .form-group { display: flex; flex-direction: column; position: relative; }
        .form-group label { font-size: 0.7rem; font-weight: 700; color: #334155; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

        .form-group input, .form-group select {
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          font-size: 0.95rem;
          background: #ffffff;
          transition: all 0.3s ease;
          color: #1e293b;
        }

        .form-group input:focus { border-color: #059669; outline: none; box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1); }

        .invalid { border-color: #ef4444 !important; }
        .valid { border-color: #10b981 !important; }

        .validation-hint { font-size: 0.65rem; margin-top: 6px; font-weight: 700; display: block; }
        .error-text { color: #dc2626; }
        .success-text { color: #059669; }

        .span-2 { grid-column: span 2; }
        .span-3 { grid-column: span 3; }

        .eye-icon {
          position: absolute;
          right: 15px;
          top: 38px;
          cursor: pointer;
          color: #64748b;
          font-size: 1.2rem;
          user-select: none;
        }

        .sector-checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .sector-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          padding: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          background: #f8fafc;
          transition: 0.2s;
          cursor: pointer;
        }

        .sector-checkbox:has(input:checked) {
          border-color: #059669;
          background: #ecfdf5;
          color: #064e3b;
        }

        .privacy-box {
          background: #f8fafc;
          padding: 40px;
          border-radius: 4px;
          margin-top: 60px;
          font-size: 0.85rem;
          color: #334155;
          line-height: 1.8;
          border: 2px solid #e2e8f0;
          border-left: 8px solid #064e3b;
        }

        .btn-register {
          width: 100%;
          background: #064e3b;
          color: #ffffff;
          padding: 24px;
          border: none;
          border-radius: 4px;
          font-weight: 800;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-top: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-register:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .btn-register:active { transform: translateY(0); }

        .banner { padding: 20px; border-radius: 4px; margin-bottom: 40px; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 15px; }
        .error-banner { background: #fef2f2; border: 2px solid #fee2e2; color: #991b1b; }
        .success-banner { background: #f0fdf4; border: 2px solid #dcfce7; color: #166534; }

        input::placeholder { color: #94a3b8; font-style: italic; }

        .file-input-wrapper {
          border: 2px dashed #cbd5e1;
          padding: 20px;
          border-radius: 4px;
          background: #f8fafc;
          transition: 0.3s;
        }
        .file-input-wrapper:hover { border-color: #059669; }

        @media (max-width: 900px) { .input-grid { grid-template-columns: 1fr; } .span-2, .span-3 { grid-column: span 1; } }
      `}</style>

      <div className="reg-wrapper">
        <div className="reg-card">
          <div className="reg-header">
            <h2>Government Resident Profiling Portal</h2>
            <p>Barangay Pasong Buaya II Digital Information Management System (BIMS)</p>
          </div>

          <div className="reg-body">
            {error && <div className="banner error-banner"><span>⚠️</span> SYSTEM ALERT: {error}</div>}
            {success && <div className="banner success-banner"><span>✅</span> SUCCESS: {success}</div>}

            <form onSubmit={handleSubmit}>
              {/* SECTION 1: ACCOUNT SETUP */}
              <div className="section-header">
                <div className="badge">1</div>
                <span className="title">Official Account Security</span>
              </div>
              <div className="input-grid">
                <div className="form-group span-2">
                  <label>Official Email Address *</label>
                  <input 
                    type="email" name="email" required 
                    className={validations.email === true ? 'valid' : validations.email === false ? 'invalid' : ''}
                    placeholder="e.g., juandelacruz@gmail.com"
                    onChange={handleChange} 
                  />
                  <span className={`validation-hint ${validations.email === false ? 'error-text' : 'success-text'}`}>
                    {validations.email === false ? '✘ Please enter a valid email format.' : validations.email === true ? '✔ Valid email format.' : 'Email will be used for official notifications.'}
                  </span>
                </div>
                <div className="form-group">
                  <label>Mobile Number (Primary) *</label>
                  <input 
                    type="text" name="contact_num" placeholder="09171234567" maxLength="11" required 
                    className={validations.mobile === true ? 'valid' : validations.mobile === false ? 'invalid' : ''}
                    onChange={handleChange} 
                  />
                  <span className={`validation-hint ${validations.mobile === false ? 'error-text' : 'success-text'}`}>
                    {validations.mobile === false ? '✘ Must be exactly 11 digits (09...)' : 'Used for SMS alerts.'}
                  </span>
                </div>
                <div className="form-group">
                  <label>Secure Password *</label>
                  <input 
                    type={showPassword ? "text" : "password"} name="password" required 
                    className={validations.password === true ? 'valid' : validations.password === false ? 'invalid' : ''}
                    placeholder="••••••••"
                    onChange={handleChange} 
                  />
                  <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </span>
                  <span className={`validation-hint ${validations.password === false ? 'error-text' : validations.password === true ? 'success-text' : ''}`}>
                    Requirements: 8+ chars, 1 Uppercase, 1 Number, 1 Special Char.
                  </span>
                </div>
                <div className="form-group">
                  <label>Re-type Password *</label>
                  <input 
                    type={showPassword ? "text" : "password"} name="confirmPassword" required 
                    className={validations.match === true ? 'valid' : validations.match === false ? 'invalid' : ''}
                    placeholder="••••••••"
                    onChange={handleChange} 
                  />
                  {validations.match === false && <span className="validation-hint error-text">✘ Passwords do not match.</span>}
                </div>
              </div>

              {/* SECTION 2: PERSONAL IDENTITY */}
              <div className="section-header">
                <div className="badge">2</div>
                <span className="title">Legal Identity & Personal Profile</span>
              </div>
              <div className="input-grid">
                <div className="form-group"><label>Given Name *</label><input type="text" name="fName" required onChange={handleChange} /></div>
                <div className="form-group"><label>Middle Name</label><input type="text" name="mName" onChange={handleChange} /></div>
                <div className="form-group"><label>Surname *</label><input type="text" name="lName" required onChange={handleChange} /></div>
                
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input type="date" name="birth_date" required onChange={handleChange} />
                  {age !== null && <span className="validation-hint success-text">System Detected Age: {age} Years</span>}
                </div>
                <div className="form-group">
                  <label>Sex at Birth *</label>
                  <select name="gender" required onChange={handleChange}>
                    <option value="">-- SELECT --</option>
                    <option value="Male">MALE</option>
                    <option value="Female">FEMALE</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Civil Status *</label>
                  <select name="civil_status" required onChange={handleChange}>
                    <option value="Single">SINGLE</option>
                    <option value="Married">MARRIED</option>
                    <option value="Widowed">WIDOWED</option>
                    <option value="Separated">SEPARATED</option>
                  </select>
                </div>

                {(formData.civil_status === 'Married' || formData.civil_status === 'Separated') && (
                  <div className="form-group span-3 animate-in">
                    <label>Legal Name of Spouse (First Middle Last) *</label>
                    <input type="text" name="spouse_name_text" required onChange={handleChange} placeholder="ENTER LEGAL NAME OF SPOUSE" />
                  </div>
                )}

                <div className="form-group"><label>Height (in Centimeters) *</label><input type="number" name="height" required onChange={handleChange} /></div>
                <div className="form-group"><label>Religion / Belief *</label><input type="text" name="religion" required onChange={handleChange} /></div>
                <div className="form-group">
                  <label>Blood Type (Optional)</label>
                  <select name="blood_type" onChange={handleChange}>
                    <option value="">-- UNKNOWN --</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* SECTION 3: SECTORAL CLASSIFICATIONS */}
              <div className="section-header">
                <div className="badge">3</div>
                <span className="title">Special Sectoral Classifications</span>
              </div>
              <div className="sector-checkbox-group">
                <label className="sector-checkbox">
                  <input type="checkbox" checked={formData.is_senior} readOnly />
                  SENIOR CITIZEN {formData.is_senior ? "(AUTO-DETECTED)" : ""}
                </label>
                <label className="sector-checkbox">
                  <input type="checkbox" name="is_pwd" onChange={handleChange} />
                  PWD (PERSON WITH DISABILITY)
                </label>
                <label className="sector-checkbox">
                  <input type="checkbox" name="is_4ps" onChange={handleChange} />
                  4PS MEMBER / BENEFICIARY
                </label>
                <label className="sector-checkbox">
                  <input type="checkbox" name="is_solo_parent" onChange={handleChange} />
                  SOLO PARENT
                </label>
                <label className="sector-checkbox">
                  <input type="checkbox" name="is_indigent" onChange={handleChange} />
                  INDIGENT RESIDENT
                </label>
              </div>

              {/* DYNAMIC PROOF UPLOADS */}
              <div className="input-grid mt-6">
                {formData.is_pwd && (
                  <div className="form-group span-3 file-input-wrapper">
                    <label>Official PWD ID Card (Front Image) *</label>
                    <input type="file" name="proof_pwd" required onChange={handleFileChange} />
                  </div>
                )}
                {formData.is_4ps && (
                  <div className="form-group span-3 file-input-wrapper">
                    <label>4Ps Membership Certification (Scan/Photo) *</label>
                    <input type="file" name="proof_4ps" required onChange={handleFileChange} />
                  </div>
                )}
                {formData.is_solo_parent && (
                  <div className="form-group span-3 file-input-wrapper">
                    <label>Solo Parent ID / Social Worker Certification *</label>
                    <input type="file" name="proof_solo_parent" required onChange={handleFileChange} />
                  </div>
                )}
                {formData.is_indigent && (
                  <div className="form-group span-3 file-input-wrapper">
                    <label>Barangay Certificate of Indigency *</label>
                    <input type="file" name="proof_indigent" required onChange={handleFileChange} />
                  </div>
                )}
              </div>

              {/* SECTION 4: PRIMARY AUTHENTICATION */}
              <div className="section-header">
                <div className="badge">4</div>
                <span className="title">Identification Authentication Documents</span>
              </div>
              <div className="input-grid">
                <div className="form-group span-3">
                  <label>Primary ID Type to be Verified *</label>
                  <select name="valid_id" required onChange={handleChange}>
                    <option value="">-- SELECT ID TYPE --</option>
                    <option value="National ID">NATIONAL ID (PHILID)</option>
                    <option value="Passport">PASSPORT</option>
                    <option value="Drivers License">DRIVER'S LICENSE</option>
                    <option value="UMID">UMID (SSS/GSIS)</option>
                    <option value="Voters ID">VOTER'S ID</option>
                    <option value="Postal ID">POSTAL ID</option>
                  </select>
                </div>
                <div className="form-group file-input-wrapper">
                  <label>ID Front View *</label>
                  <input type="file" name="valid_id_img_front" required onChange={handleFileChange} />
                </div>
                <div className="form-group file-input-wrapper">
                  <label>ID Back View *</label>
                  <input type="file" name="valid_id_img_back" required onChange={handleFileChange} />
                </div>
                <div className="form-group file-input-wrapper">
                  <label>Verification Selfie (Holding ID) *</label>
                  <input type="file" name="valid_id_img_holding" required onChange={handleFileChange} />
                  <span className="validation-hint">Ensure your face and the ID details are both clear.</span>
                </div>
              </div>

              {/* PRIVACY ACT COMPLIANCE */}
              <div className="privacy-box">
                <h4 style={{margin:'0 0 15px 0', color: '#064e3b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing:'1px'}}>
                  RA 10173: Data Privacy Act of 2012 Compliance
                </h4>
                <p>
                  By completing this form, you authorize <strong>Barangay Pasong Buaya II</strong> to collect, store, and process your personal and sensitive information for profiling and public service purposes. 
                  Your data is protected under the <strong>Data Privacy Act (RA 10173)</strong>. We implement strict organizational and technical security measures to ensure that your records remain confidential 
                  and are only accessed by authorized personnel for official government functions.
                </p>
                <label style={{marginTop:'25px', cursor:'pointer', display:'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <input 
                    type="checkbox" 
                    name="privacy_agreed" 
                    checked={formData.privacy_agreed} 
                    onChange={handleChange} 
                    required 
                    style={{marginTop:'5px', width:'20px', height:'20px'}} 
                  />
                  <span style={{fontWeight:800, color: '#0f172a', fontSize: '0.9rem'}}>
                    I certify that all information provided is true and correct, and I agree to the Official Terms of Service and Data Privacy Policy. *
                  </span>
                </label>
              </div>

              <button type="submit" className="btn-register">
                Commit Profile to BIMS Official Registry
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Register;