// src/pages/LandingPage.js
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/faculty', { replace: true });
  }, [user, navigate]);

  const features = [
    'Auto Allocation',
    'Smart Scheduling',
    'Conflict Detection',
    'Email Notifications',
    'Role-based Access',
    'Real-time Dashboard',
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e2e8f0',
      fontFamily: "'Inter', 'Sora', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated gradient blobs */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
      </div>

      {/* Noise/grid overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ── Navbar ── */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 48px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(10,10,15,0.6)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '800',
              color: '#fff',
              boxShadow: '0 0 20px rgba(168,85,247,0.4)',
            }}>E</div>
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#f1f5f9',
              letterSpacing: '-0.3px',
            }}>EDMS</span>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          textAlign: 'center',
          padding: '100px 24px 80px',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(168,85,247,0.1)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: '100px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#c084fc',
            letterSpacing: '0.5px',
            marginBottom: '32px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#a855f7',
              boxShadow: '0 0 8px #a855f7',
              display: 'inline-block',
            }} />
            Examination Duty Management System
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-2px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 40%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Smarter Exam Duty.<br />Zero Conflicts.
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: '18px',
            color: 'rgba(226,232,240,0.6)',
            maxWidth: '560px',
            margin: '0 auto 40px',
            lineHeight: '1.75',
            fontWeight: '400',
          }}>
            A modern platform for automated examination duty allocation,
            faculty scheduling, and smart conflict resolution.
          </p>

          {/* Feature pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '64px',
          }}>
            {features.map(f => (
              <span key={f} style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '500',
                color: 'rgba(226,232,240,0.65)',
              }}>{f}</span>
            ))}
          </div>

          {/* Portal cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '720px',
            margin: '0 auto',
          }}>
            {/* Admin portal */}
            <Link to="/admin-login" className="lp-portal-card lp-admin-card" style={{
              display: 'block',
              textDecoration: 'none',
              padding: '36px 32px',
              borderRadius: '20px',
              background: 'rgba(168,85,247,0.06)',
              border: '1px solid rgba(168,85,247,0.25)',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.3s ease',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))',
                border: '1px solid rgba(168,85,247,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '20px',
              }}>⚡</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#c084fc', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Administrator
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Admin Portal
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(226,232,240,0.55)', lineHeight: '1.6', marginBottom: '24px' }}>
                Manage faculty, run allocations, configure schedules and oversee the entire system.
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#c084fc',
              }}>
                Sign in to Admin <span style={{ fontSize: '16px' }}>→</span>
              </div>
            </Link>

            {/* Faculty portal */}
            <Link to="/faculty-login" className="lp-portal-card lp-faculty-card" style={{
              display: 'block',
              textDecoration: 'none',
              padding: '36px 32px',
              borderRadius: '20px',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.25)',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.3s ease',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.2))',
                border: '1px solid rgba(59,130,246,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '20px',
              }}>🎓</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Teaching Staff
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Faculty Portal
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(226,232,240,0.55)', lineHeight: '1.6', marginBottom: '24px' }}>
                View your duty assignments, mark availability, and receive real-time notifications.
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#60a5fa',
              }}>
                Sign in to Faculty <span style={{ fontSize: '16px' }}>→</span>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '13px', color: 'rgba(226,232,240,0.25)' }}>
            © 2025 Examination Duty Management System. All rights reserved.
          </span>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* Blobs */
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
        }
        .lp-blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #7c3aed, transparent 70%);
          top: -200px; left: -100px;
          animation: lp-float1 12s ease-in-out infinite alternate;
        }
        .lp-blob-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #1d4ed8, transparent 70%);
          top: 100px; right: -100px;
          animation: lp-float2 15s ease-in-out infinite alternate;
        }
        .lp-blob-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #0e7490, transparent 70%);
          bottom: 0; left: 30%;
          animation: lp-float3 10s ease-in-out infinite alternate;
        }
        @keyframes lp-float1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes lp-float2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-50px, 60px) scale(1.08); }
        }
        @keyframes lp-float3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -50px) scale(1.05); }
        }

        /* Portal card hovers */
        .lp-admin-card:hover {
          background: rgba(168,85,247,0.1) !important;
          border-color: rgba(168,85,247,0.5) !important;
          box-shadow: 0 0 60px rgba(168,85,247,0.2), 0 24px 64px rgba(0,0,0,0.4) !important;
          transform: translateY(-4px);
        }
        .lp-faculty-card:hover {
          background: rgba(59,130,246,0.1) !important;
          border-color: rgba(59,130,246,0.5) !important;
          box-shadow: 0 0 60px rgba(59,130,246,0.2), 0 24px 64px rgba(0,0,0,0.4) !important;
          transform: translateY(-4px);
        }

        /* Responsive */
        @media (max-width: 480px) {
          nav { padding: 16px 20px !important; }
          footer { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  );
}
