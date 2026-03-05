// src/pages/faculty/Dashboard.js
import { useState, useEffect } from 'react';
import { dashboard } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    dashboard.get()
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load dashboard'));
  }, []);

  const statusColors = { assigned:'badge-assigned', acknowledged:'badge-acknowledged', completed:'badge-completed', absent:'badge-cancelled' };

  if (error) return (
    <div className="page-body" style={{paddingTop:'32px'}}>
      <div className="card" style={{textAlign:'center', padding:'48px'}}>
        <div style={{fontSize:'40px', marginBottom:'12px'}}>⚠️</div>
        <p style={{color:'var(--danger)', fontSize:'15px'}}>{error}</p>
        <p style={{color:'var(--text-muted)', fontSize:'13px', marginTop:'8px'}}>Make sure you are logged in correctly and try refreshing the page.</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h2>Welcome, {user?.name?.split(' ')[0]} 👋</h2>
        <p>{user?.department} • Your exam duty overview</p>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-label">Total Duties</div>
            <div className="stat-value accent">{data?.total_duties ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div className="stat-label">Upcoming Duties</div>
            <div className="stat-value warning">{data?.upcoming_duties ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-label">Completed</div>
            <div className="stat-value success">{data?.completed_duties ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔔</div>
            <div className="stat-label">Unread Alerts</div>
            <div className="stat-value">{data?.unread_notifications ?? 0}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Duties</h3>
          </div>
          {data?.upcoming_list?.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Subject</th><th>Date</th><th>Time</th><th>Venue</th><th>Duty Type</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {data.upcoming_list.map(d => (
                    <tr key={d.id}>
                      <td style={{fontWeight:'600'}}>{d.subject_name}</td>
                      <td>{new Date(d.exam_date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</td>
                      <td>{d.start_time} – {d.end_time}</td>
                      <td>{d.venue}</td>
                      <td><span className="badge badge-assigned">{d.duty_type}</span></td>
                      <td><span className={`badge ${statusColors[d.status]}`}>{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">🎉</div>
              <p>No upcoming duties assigned to you</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
