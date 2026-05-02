const Services = () => {
  return (
    <section className="services-section" id="services">
      <div className="section-header max-w-4xl mx-auto mb-20">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-6">Streamlined Operations</h2>
        <p className="text-xl text-slate-600 text-center max-w-2xl mx-auto">Select a service to proceed</p>
      </div>
      
      <div className="services-grid max-w-6xl mx-auto">
        <div className="service-card" onClick={() => window.location.href = '/incident-report'}>
          <div className="card-icon"><i className="bi bi-shield-exclamation"></i></div>
          <h4 className="text-2xl font-bold mb-4 text-slate-800">Report Incident</h4>
          <p className="text-slate-600 leading-relaxed">File reports securely and track resolution status in real-time.</p>
        </div>

        <div className="service-card" onClick={() => window.location.href = '/services'}>
          <div className="card-icon"><i className="bi bi-file-earmark-text-fill"></i></div>
          <h4 className="text-2xl font-bold mb-4 text-slate-800">Request Documents</h4>
          <p className="text-slate-600 leading-relaxed">Automated issuance for Clearances, Indigency, and Residency.</p>
        </div>

        <div className="service-card" onClick={() => window.location.href = '/volunteer'}>
          <div className="card-icon"><i className="bi bi-people-fill"></i></div>
          <h4 className="text-2xl font-bold mb-4 text-slate-800">Volunteer Corps</h4>
          <p className="text-slate-600 leading-relaxed">Join our task force for community building and disaster response.</p>
        </div>

        <div className="service-card" onClick={() => window.location.href = '/feedback'}>
          <div className="card-icon"><i className="bi bi-megaphone-fill"></i></div>
          <h4 className="text-2xl font-bold mb-4 text-slate-800">Citizen Feedback</h4>
          <p className="text-slate-600 leading-relaxed">Direct line to the administration for transparent governance.</p>
        </div>
      </div>
    </section>
  );
};

export default Services;
