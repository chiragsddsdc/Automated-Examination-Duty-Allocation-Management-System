// src/pages/admin/ChangePassword.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function ChangePassword() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOld, setShowOld]         = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);

  // Password strength: returns { label, color, width }
  const getStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 6)               score++;
    if (pwd.length >= 10)              score++;
    if (/[A-Z]/.test(pwd))            score++;
    if (/[0-9]/.test(pwd))            score++;
    if (/[^A-Za-z0-9]/.test(pwd))    score++;

    if (score <= 1) return { label: 'Weak',   color: '#ef4444', width: '25%'  };
    if (score <= 2) return { label: 'Fair',   color: '#f97316', width: '50%'  };
    if (score <= 3) return { label: 'Good',   color: '#eab308', width: '75%'  };
    return           { label: 'Strong', color: '#22c55e', width: '100%' };
  };

  const strength = getStrength(form.new_password);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.old_password === form.new_password) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.changePassword(form.old_password, form.new_password);
      toast.success(res.data.message || 'Password changed! Please log in again.');
      // Backend invalidates all tokens — log out immediately
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>🔒</div>
          <h2 style={styles.title}>Change Password</h2>
          <p style={styles.subtitle}>
            Choose a strong password. You will be logged out after changing it.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Current Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Current Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔑</span>
              <input
                type={showOld ? 'text' : 'password'}
                name="old_password"
                value={form.old_password}
                onChange={handleChange}
                placeholder="Enter your current password"
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                style={styles.eyeBtn}
                title={showOld ? 'Hide' : 'Show'}
              >
                {showOld ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={styles.divider} />

          {/* New Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔐</span>
              <input
                type={showNew ? 'text' : 'password'}
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Enter new password (min. 6 characters)"
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={styles.eyeBtn}
                title={showNew ? 'Hide' : 'Show'}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
            {/* Password strength bar */}
            {strength && (
              <div style={styles.strengthWrap}>
                <div style={styles.strengthTrack}>
                  <div style={{ ...styles.strengthBar, width: strength.width, backgroundColor: strength.color }} />
                </div>
                <span style={{ ...styles.strengthLabel, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>✅</span>
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter your new password"
                required
                style={{
                  ...styles.input,
                  borderColor: form.confirm_password
                    ? form.confirm_password === form.new_password ? '#22c55e' : '#ef4444'
                    : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
                title={showConfirm ? 'Hide' : 'Show'}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {form.confirm_password && form.confirm_password !== form.new_password && (
              <p style={styles.matchError}>✗ Passwords do not match</p>
            )}
            {form.confirm_password && form.confirm_password === form.new_password && (
              <p style={styles.matchOk}>✓ Passwords match</p>
            )}
          </div>

          {/* Requirements list */}
          <div style={styles.requirements}>
            <p style={styles.reqTitle}>Password requirements:</p>
            <ul style={styles.reqList}>
              <li style={reqItem(form.new_password.length >= 6)}>At least 6 characters</li>
              <li style={reqItem(/[A-Z]/.test(form.new_password))}>At least one uppercase letter</li>
              <li style={reqItem(/[0-9]/.test(form.new_password))}>At least one number</li>
            </ul>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Updating...' : '🔒 Update Password'}
          </button>

        </form>
      </div>
    </div>
  );
}

const reqItem = (met) => ({
  color: met ? '#22c55e' : '#94a3b8',
  fontSize: '13px',
  marginBottom: '4px',
  listStyle: 'none',
  paddingLeft: '0',
});

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'var(--bg-primary, #0f172a)',
  },
  card: {
    background: 'var(--bg-card, #1e293b)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #3b1f6e 0%, #6d28d9 100%)',
    padding: '32px 40px 28px',
    textAlign: 'center',
  },
  iconWrap: {
    fontSize: '36px',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 8px',
    color: '#fff',
    fontSize: '22px',
    fontWeight: '700',
  },
  subtitle: {
    margin: 0,
    color: '#ddd6fe',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  form: {
    padding: '32px 40px 36px',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    color: 'var(--text-secondary, #94a3b8)',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '11px 44px 11px 40px',
    background: 'var(--bg-input, #0f172a)',
    border: '1px solid var(--border, #334155)',
    borderRadius: '8px',
    color: 'var(--text-primary, #f1f5f9)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    lineHeight: 1,
  },
  strengthWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
  },
  strengthTrack: {
    flex: 1,
    height: '4px',
    background: '#334155',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s, background-color 0.3s',
  },
  strengthLabel: {
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '44px',
  },
  matchError: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#ef4444',
  },
  matchOk: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#22c55e',
  },
  divider: {
    borderTop: '1px solid var(--border, #334155)',
    marginBottom: '20px',
  },
  requirements: {
    background: 'var(--bg-input, #0f172a)',
    borderRadius: '8px',
    padding: '14px 18px',
    marginBottom: '24px',
    border: '1px solid var(--border, #334155)',
  },
  reqTitle: {
    margin: '0 0 8px',
    color: 'var(--text-secondary, #94a3b8)',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reqList: {
    margin: 0,
    padding: 0,
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #3b1f6e 0%, #6d28d9 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    letterSpacing: '0.3px',
  },
};
