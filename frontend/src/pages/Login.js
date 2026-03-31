// src/pages/Login.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/faculty');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('admin@exam.edu'); setPassword('password123'); }
    else { setEmail('priya@exam.edu'); setPassword('password123'); }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-icon">📋</div>
          <h1>ExamDuty</h1>
          <p>Automated Examination Duty<br />Allocation & Management</p>
        </div>
        <div className="login-features">
          <div className="feature">✓ &nbsp;Fair workload distribution</div>
          <div className="feature">✓ &nbsp;Real-time notifications</div>
          <div className="feature">✓ &nbsp;Smart conflict detection</div>
          <div className="feature">✓ &nbsp;Auto-generated reports</div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <h2>Sign In</h2>
          <p className="login-sub">Enter your credentials to access the system</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.edu" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>

            <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'13px'}} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="demo-accounts">
            <p>Demo Accounts</p>
            <div className="demo-btns">
              <button className="btn btn-secondary btn-sm" onClick={() => fillDemo('admin')}>
                👤 Admin Login
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => fillDemo('faculty')}>
                🎓 Faculty Login
              </button>
            </div>
            <span style={{fontSize:'12px', color:'var(--text-muted)'}}>Password: password123</span>
          </div>
        </div>
      </div>

      <style>{`
        .login-page { display:flex; min-height:100vh; }
        .login-left {
          flex:1; background:linear-gradient(135deg, #0a0f1e 0%, #0f1f3d 100%);
          display:flex; flex-direction:column; justify-content:center;
          padding:60px; position:relative; overflow:hidden;
        }
        .login-left::after {
          content:''; position:absolute; top:-100px; right:-100px;
          width:400px; height:400px; border-radius:50%;
          background:radial-gradient(circle, rgba(79,140,255,0.12) 0%, transparent 70%);
        }
        .brand-icon { font-size:48px; margin-bottom:16px; }
        .login-brand h1 { font-size:36px; font-weight:800; letter-spacing:-1px; margin-bottom:12px; }
        .login-brand p { font-size:16px; color:var(--text-secondary); line-height:1.6; }
        .login-features { margin-top:48px; }
        .feature { font-size:15px; color:var(--text-secondary); padding:8px 0; }
        .login-right {
          width:440px; background:var(--bg-secondary);
          display:flex; align-items:center; justify-content:center; padding:48px;
          border-left:1px solid var(--border);
        }
        .login-box { width:100%; }
        .login-box h2 { font-size:28px; font-weight:700; margin-bottom:8px; }
        .login-sub { color:var(--text-secondary); font-size:14px; margin-bottom:32px; }
        .demo-accounts { margin-top:24px; padding-top:20px; border-top:1px solid var(--border); text-align:center; }
        .demo-accounts p { font-size:12px; color:var(--text-muted); margin-bottom:10px; text-transform:uppercase; letter-spacing:1px; }
        .demo-btns { display:flex; gap:8px; justify-content:center; margin-bottom:8px; }
        @media(max-width:768px) {
          .login-left { display:none; }
          .login-right { width:100%; padding:32px 20px; min-height:100vh; align-items:flex-start; padding-top:48px; }
          .login-box h2 { font-size:24px; }
          .login-sub { margin-bottom:24px; }
          .demo-btns { flex-wrap:wrap; }
          .demo-btns .btn { flex:1 1 130px; justify-content:center; }
        }
        @media(max-width:420px) {
          .login-right { padding:24px 16px; padding-top:36px; }
          .demo-btns { flex-direction:column; }
          .demo-btns .btn { width:100%; }
        }
      `}</style>
    </div>
  );
}
