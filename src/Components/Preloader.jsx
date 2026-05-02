import { useEffect, useState } from 'react';
import logo from '../assets/img/PB2_logo.png';

const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div id="preloader" className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <div className="text-center">
        <img 
          src={logo} 
          alt="Pasong Buaya 2 Logo" 
          className="w-[400px] h-auto mb-5 animate-pulseLogo drop-shadow-xl mx-auto"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'block';
          }}
        />
        <div className="loader-logo hidden">
          <i className="bi bi-shield-fill-check text-6xl"></i>
        </div>
        <div className="loader-bar w-[180px] h-1 bg-slate-200 rounded-full overflow-hidden mx-auto">
          <div className="loader-fill h-full bg-primary animate-loadProgress rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
