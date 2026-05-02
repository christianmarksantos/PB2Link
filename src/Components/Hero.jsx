import { useEffect, useRef } from 'react';

const Hero = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    let particles = [];
    const mouse = { x: null, y: null };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5;
        this.speedX = (Math.random() * 1.5) - 0.75;
        this.speedY = (Math.random() * 1.5) - 0.75;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < 120) {
          this.x -= dx/20;
          this.y -= dy/20;
        }
      }
      draw() {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < 90; i++) particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - dist/120})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }

    initParticles();
    animate();

    // Magnetic buttons logic
    const btns = document.querySelectorAll('.btn-magnetic');
    btns.forEach(btn => {
      btn.addEventListener('mousemove', function(e) {
        const pos = btn.getBoundingClientRect();
        const x = e.clientX - pos.left - pos.width / 2;
        const y = e.clientY - pos.top - pos.height / 2;
        
        // Move button slightly towards mouse
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      
      btn.addEventListener('mouseleave', function() {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      // Clean up button listeners
      btns.forEach(btn => {
        btn.removeEventListener('mousemove', null);
        btn.removeEventListener('mouseleave', null);
      });
    };
  }, []);

  return (
    <main className="hero-section">
      <canvas ref={canvasRef} id="heroCanvas" />
      
      <div className="hero-content">
        <div className="hero-label">
          <i className="bi bi-patch-check-fill"></i> Official Government Portal
        </div>
        <h2>Governance at<br />Your Fingertips.</h2>
        <p>Experience a new standard of public service. Fast, transparent, and completely digital.</p>
        
        <div className="hero-buttons">
          <button 
            className="btn-magnetic primary"
            onClick={() => window.location.href = '/login'}
          >
            <i className="bi bi-speedometer2"></i>Get Started
          </button>
          <button 
            className="btn-magnetic outline"
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <i className="bi bi-grid-fill"></i>Explore Services
          </button>
        </div>
      </div>
    </main>
  );
};

export default Hero;
