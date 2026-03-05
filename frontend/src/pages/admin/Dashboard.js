// src/pages/admin/Dashboard.js
import { useState, useEffect } from 'react';
import { dashboard } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get().then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const colors = ['#4f8cff','#7c3aed','#10b981','#f59e0b','#ef4444'];

  return (
    <>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p>Overview of examination duty management system</p>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-label">Active Faculty</div>
            <div className="stat-value accent">{data?.total_faculty ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">Total Exams</div>
            <div className="stat-value">{data?.total_exams ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div className="stat-label">Upcoming Exams</div>
            <div className="stat-value warning">{data?.upcoming_exams ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-label">Duties Allocated</div>
            <div className="stat-value success">{data?.total_allocations ?? 0}</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Department Workload Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Department Duty Load</h3>
            </div>
            {data?.dept_workload?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dept_workload} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="department" tick={{fontSize:11, fill:'#94a3b8'}} />
                  <YAxis tick={{fontSize:11, fill:'#94a3b8'}} />
                  <Tooltip
                    contentStyle={{background:'#131c31', border:'1px solid rgba(99,143,255,0.2)', borderRadius:'8px', fontSize:'13px'}}
                    cursor={{fill:'rgba(99,143,255,0.06)'}}
                  />
                  <Bar dataKey="duty_count" name="Duties" radius={[4,4,0,0]}>
                    {data.dept_workload.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No allocation data yet</p></div>}
          </div>

          {/* Upcoming Exams */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Exams</h3>
            </div>
            {data?.upcoming_list?.length ? (
              <div>
                {data.upcoming_list.map(exam => (
                  <div key={exam.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)'}}>
                    <div>
                      <div style={{fontSize:'14px', fontWeight:'600'}}>{exam.subject_name}</div>
                      <div style={{fontSize:'12px', color:'var(--text-muted)'}}>
                        {new Date(exam.exam_date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})} • {exam.venue}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'13px', color: exam.allocated >= exam.duties_required ? 'var(--success)' : 'var(--warning)'}}>
                        {exam.allocated}/{exam.duties_required} assigned
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty-state"><p>No upcoming exams</p></div>}
          </div>
        </div>

        {/* Recent Allocations */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Recent Allocations</h3>
          </div>
          {data?.recent_allocations?.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Faculty</th>
                  <th>Subject</th>
                  <th>Venue</th>
                  <th>Exam Date</th>
                  <th>Duty Type</th>
                </tr></thead>
                <tbody>
                  {data.recent_allocations.map((a, i) => (
                    <tr key={i}>
                      <td style={{fontWeight:'600'}}>{a.faculty_name}</td>
                      <td>{a.subject_name}</td>
                      <td>{a.venue}</td>
                      <td>{new Date(a.exam_date).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge badge-assigned">{a.duty_type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">📋</div>
              <p>No allocations yet. Go to <strong>Run Allocation</strong> to start!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
