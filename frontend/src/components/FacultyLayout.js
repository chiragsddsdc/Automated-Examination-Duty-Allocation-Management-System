// src/components/FacultyLayout.js
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/faculty', label: 'Dashboard', icon: '📊', end: true },
  { to: '/faculty/duties', label: 'My Duties', icon: '📋' },
  { to: '/faculty/availability', label: 'Availability', icon: '📅' },
  { to: '/faculty/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/faculty/change-password', label: 'Change Password', icon: '🔒' },
];

export default function FacultyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="layout">

      {/* ── Mobile top header bar ── */}
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="mobile-header-logo">
          <h1>ExamDuty</h1>
          <span>Faculty Portal</span>
        </div>
        {user && (
          <div className="avatar" style={{ flexShrink: 0 }}>
            {user.name?.[0]}
          </div>
        )}
      </div>

      {/* ── Backdrop overlay (mobile only) ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-row">
            <div>
              <h1>ExamDuty</h1>
              <span>Faculty Portal</span>
            </div>
            {/* Close button — only visible on mobile via CSS */}
            <button
              className="sidebar-close-btn"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.[0]}</div>
            <div className="user-info-text">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.department || 'Faculty'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
}
