// src/pages/FacultyLogin.js
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth as authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function FacultyLogin() {
  const [mode, setMode]               = useState('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPass, setShowPass]       = useState(false);

  const { login, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'faculty') navigate('/faculty', { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role !== 'faculty') {
        await logout();
        setMode('denied');
        return;
      }
      toast.success(`Welcome, ${u.name}!`);
      navigate('/faculty');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await authAPI.forgotPassword(forgotEmail); } catch (_) {}
    finally { setLoading(false); setMode('forgot-sent'); }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: "'Inter', 'Sora', system-ui, sans-serif",
    color: '#f1f5f9',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(226,232,240,0.7)',
    marginBottom: '8px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      fontFamily: "'Inter', 'Sora', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="fl-blob fl-blob-1" />
        <div className="fl-blob fl-blob-2" />
      </div>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '28px 28px', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '420px' }}>

        {/* Back link */}
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'rgba(226,232,240,0.45)',
          textDecoration: 'none',
          marginBottom: '32px',
          transition: 'color 0.2s',
        }} className="fl-back-link">
          ← Back to home
        </Link>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '20px',
          padding: '40px 36px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 80px rgba(59,130,246,0.1), 0 32px 80px rgba(0,0,0,0.5)',
        }}>

          {/* ── Login mode ── */}
          {mode === 'login' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.15))',
                  border: '1px solid rgba(59,130,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', margin: '0 auto 20px',
                  boxShadow: '0 0 30px rgba(59,130,246,0.2)',
                }}>🎓</div>
                <h1 style={{
                  fontSize: '24px', fontWeight: '800', color: '#f1f5f9',
                  letterSpacing: '-0.5px', marginBottom: '6px',
                }}>Faculty Portal</h1>
                <p style={{ fontSize: '13px', color: 'rgba(226,232,240,0.45)', lineHeight: '1.5' }}>
                  View your duties, availability &amp; notifications
                </p>
              </div>

              <form onSubmit={handleLogin} noValidate>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="faculty@institution.ac.in"
                    required
                    autoComplete="email"
                    style={inputStyle}
                    className="fl-input"
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email); setMode('forgot'); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '600',
                        color: '#60a5fa', padding: 0, fontFamily: 'inherit',
                        transition: 'opacity 0.2s',
                      }}
                      className="fl-link-btn"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      style={{ ...inputStyle, paddingRight: '44px' }}
                      className="fl-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '15px', opacity: '0.5', transition: 'opacity 0.2s',
                        color: '#f1f5f9',
                      }}
                      className="fl-eye-btn"
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
                    border: 'none', borderRadius: '10px',
                    fontSize: '14px', fontWeight: '700', color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.2px', fontFamily: 'inherit',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(59,130,246,0.4)',
                    transition: 'all 0.2s',
                  }}
                  className="fl-submit-btn"
                >
                  {loading ? 'Signing in…' : 'Sign in to Faculty Portal →'}
                </button>
              </form>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />

              <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(226,232,240,0.4)' }}>
                Are you an administrator?{' '}
                <Link to="/admin-login" style={{
                  color: '#c084fc', fontWeight: '600', textDecoration: 'none',
                }} className="fl-portal-link">
                  Admin Portal →
                </Link>
              </div>
            </>
          )}

          {/* ── Access Denied ── */}
          {mode === 'denied' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>⛔</div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f87171', marginBottom: '8px' }}>
                Access Denied
              </h2>
              <div style={{
                display: 'inline-block',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#f87171', padding: '4px 14px', borderRadius: '100px',
                fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: '1px', marginBottom: '20px',
              }}>Wrong Portal</div>
              <p style={{
                fontSize: '14px', color: 'rgba(226,232,240,0.55)', lineHeight: '1.7',
                background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
                borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', textAlign: 'left',
              }}>
                Your account is registered as <strong style={{ color: '#f87171' }}>Administrator</strong>, not Faculty.
                Please use the Admin Portal to sign in.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/admin-login" style={{
                  display: 'block', padding: '13px',
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  color: '#fff', textDecoration: 'none',
                  borderRadius: '10px', fontSize: '14px', fontWeight: '700', textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
                }}>
                  Go to Admin Portal →
                </Link>
                <button
                  onClick={() => { setMode('login'); setEmail(''); setPassword(''); }}
                  style={{
                    padding: '12px', background: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: 'rgba(226,232,240,0.6)',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  className="fl-outline-btn"
                >
                  Try a Different Account
                </button>
              </div>
            </div>
          )}

          {/* ── Forgot password ── */}
          {mode === 'forgot' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '16px',
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', margin: '0 auto 20px',
                }}>🔑</div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '6px' }}>
                  Reset Password
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(226,232,240,0.45)', lineHeight: '1.5' }}>
                  We'll send a reset link to your email address.
                </p>
              </div>
              <form onSubmit={handleForgot} noValidate>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Email address</label>
                  <input
                    type="email" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="faculty@institution.ac.in"
                    required autoFocus
                    style={inputStyle}
                    className="fl-input"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
                    border: 'none', borderRadius: '10px',
                    fontSize: '14px', fontWeight: '700', color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
              </form>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setMode('login')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600', color: 'rgba(226,232,240,0.45)',
                    fontFamily: 'inherit', transition: 'color 0.2s',
                  }}
                  className="fl-link-btn"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {/* ── Forgot sent ── */}
          {mode === 'forgot-sent' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', margin: '0 auto 20px',
              }}>📧</div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>
                Check Your Inbox
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(226,232,240,0.5)', lineHeight: '1.65', marginBottom: '20px' }}>
                If <strong style={{ color: '#60a5fa' }}>{forgotEmail}</strong> is registered, a reset link has been sent.
              </p>
              <div style={{
                background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '10px', padding: '14px 16px',
                fontSize: '13px', color: 'rgba(226,232,240,0.55)',
                lineHeight: '1.65', textAlign: 'left', marginBottom: '28px',
              }}>
                Check your inbox and spam folder. The link expires in <strong style={{ color: '#86efac' }}>30 minutes</strong>.
              </div>
              <button
                onClick={() => setMode('login')}
                style={{
                  width: '100%', padding: '13px',
                  background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700', color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: 'rgba(226,232,240,0.2)' }}>
          © 2025 Examination Duty Management System
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .fl-blob {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.3;
        }
        .fl-blob-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #1d4ed8, transparent 70%);
          top: -200px; right: -150px;
          animation: fl-float1 14s ease-in-out infinite alternate;
        }
        .fl-blob-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #0e7490, transparent 70%);
          bottom: -150px; left: -100px;
          animation: fl-float2 11s ease-in-out infinite alternate;
        }
        @keyframes fl-float1 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-50px, 60px); }
        }
        @keyframes fl-float2 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, -50px); }
        }

        .fl-input:focus {
          border-color: rgba(59,130,246,0.5) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        .fl-input::placeholder { color: rgba(226,232,240,0.2); }

        .fl-submit-btn:hover:not(:disabled) {
          box-shadow: 0 8px 32px rgba(59,130,246,0.55) !important;
          transform: translateY(-1px);
        }

        .fl-outline-btn:hover {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.2) !important;
          color: rgba(226,232,240,0.8) !important;
        }

        .fl-link-btn:hover { opacity: 0.8 !important; }
        .fl-portal-link:hover { opacity: 0.8 !important; }
        .fl-back-link:hover { color: rgba(226,232,240,0.7) !important; }
        .fl-eye-btn:hover { opacity: 1 !important; }

        @media (max-width: 480px) {
          .fl-back-link { margin-bottom: 20px !important; }
        }
      `}</style>
    </div>
  );
}
