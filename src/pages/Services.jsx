import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import '../styles/services.css'; 

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Services');
  const navigate = useNavigate();

  // Logic to check if user is logged in (checks localStorage for a stored user/token)
  const isLoggedIn = localStorage.getItem('user') !== null || localStorage.getItem('token') !== null;

  const servicesList = [
    {
      id: 'clearance',
      title: 'Barangay Clearance',
      description: 'Apply for your official Barangay Clearance digitally in just a few minutes.',
      icon: 'bi-file-earmark-text-fill',
      category: 'Documents'
    },
    {
      id: 'residency',
      title: 'Certificate of Residency',
      description: 'Request your residency certificate without visiting the office.',
      icon: 'bi-house-check-fill',
      category: 'Documents'
    },
    {
      id: 'id',
      title: 'Barangay ID',
      description: 'Apply for your official Barangay ID for verification and records.',
      icon: 'bi-person-badge-fill',
      category: 'Documents'
    },
    {
      id: 'business',
      title: 'Business Clearance',
      description: 'Secure your barangay clearance for business operations quickly.',
      icon: 'bi-briefcase-fill',
      category: 'Permits'
    },
    {
      id: 'indigency',
      title: 'Certificate of Indigency',
      description: 'Get certification assistance for scholarship or medical aid purposes.',
      icon: 'bi-heart-pulse-fill',
      category: 'Documents'
    },
    {
      id: 'volunteer',
      title: 'Volunteer Registration',
      description: 'Join community projects and outreach programs within the barangay.',
      icon: 'bi-people-fill',
      category: 'Community'
    },
    {
      id: 'Amenities',
      title: 'Amenity Reservation',
      description: 'Schedule and book barangay facilities like the multi-purpose hall or court.',
      icon: 'bi-calendar-event-fill',
      category: 'Community',
      link: '/amenity-reservation' // Change this to '/bookings' if that is your route name
    },
  ];

  const handleRequestClick = (service) => {
    if (!isLoggedIn) {
      // System Alert for Unauthenticated Users
      const confirmLogin = window.confirm("You Must Login First.");
      if (confirmLogin) {
        navigate('/login');
      }
    } else {
      // Navigate to custom link if it exists, otherwise use dynamic request path
      if (service.link) {
        navigate(service.link);
      } else {
        navigate(`/request/${service.id}`);
      }
    }
  };

  const filteredServices = servicesList.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All Services' || service.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Preloader />
      <Header />

      <main className="services-page-wrapper">
        <div className="sp-container">
          
          <div className="sp-header">
            <h1>Barangay Public Services</h1>
            <p>Access official Pasong Buaya II requests digitally. Search or filter to begin your application.</p>
          </div>

          <div className="sp-search-bar">
            <input 
              type="text" 
              placeholder="Search services (e.g. Clearance, ID, Reservation)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bi bi-search"></i>
          </div>

          <div className="sp-filters">
            {['All Services', 'Documents', 'Permits', 'Community'].map(filter => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`sp-filter-btn ${activeFilter === filter ? 'active' : 'inactive'}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="sp-main-card">
            <div className="sp-grid">
              
              {filteredServices.length > 0 ? (
                filteredServices.map(service => (
                  <div key={service.id} className="sp-service-card">
                    <div className="sp-icon-wrapper">
                       <i className={`bi ${service.icon} sp-service-icon`}></i>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <button 
                      className="sp-btn-request" 
                      onClick={() => handleRequestClick(service)}
                    > 
                      Request Now 
                    </button>
                  </div>
                ))
              ) : (
                <div className="sp-no-results">
                  <i className="bi bi-search" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '10px', display: 'block' }}></i>
                  <h3>No matching services</h3>
                  <p>Try searching for a different keyword or check your spelling.</p>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default Services;