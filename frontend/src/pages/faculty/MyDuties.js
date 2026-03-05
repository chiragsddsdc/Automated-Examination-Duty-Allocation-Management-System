// src/pages/faculty/MyDuties.js
import { useState, useEffect } from 'react';
import { allocations } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function MyDuties() {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.faculty_profile_id) {
      allocations.getAll({ faculty_id: user.faculty_profile_id })
        .then(res => setDuties(res.data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filtered = duties.filter(d => filter === 'all' || d.status === filter);

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const headers = ['Subject','Date','Start Time','End Time','Venue','Duty Type','Status'];
    const rows = filtered.map(d => [d.subject_name, d.exam_date, d.start_time, d.end_time, d.venue, d.duty_type_name, d.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'my_duties.csv'; a.click();
  };

  return (
    <>
      <div className="page-header">
        <h2>My Duties</h2>
        <p>All exam duties assigned to you</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="flex gap-2">
              {['all','assigned','acknowledged','completed','absent'].map(s => (
                <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter(s)} style={{textTransform:'capitalize'}}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={handleCSV}>⬇ Export CSV</button>
              <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Print</button>
            </div>
          </div>

          {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
            filtered.length === 0 ? (
              <div className="empty-state"><div className="icon">📋</div><p>No duties found</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>#</th><th>Subject</th><th>Date</th><th>Time</th><th>Venue</th><th>Duty Type</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map((d, i) => {
                      const isPast = new Date(d.exam_date) < new Date();
                      return (
                        <tr key={d.id} style={isPast ? {opacity: 0.6} : {}}>
                          <td style={{color:'var(--text-muted)'}}>{i+1}</td>
                          <td style={{fontWeight:'600'}}>{d.subject_name}</td>
                          <td>
                            <div>{new Date(d.exam_date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</div>
                            {!isPast && (
                              <div style={{fontSize:'11px', color:'var(--accent)'}}>
                                {Math.ceil((new Date(d.exam_date) - new Date()) / 86400000)} days left
                              </div>
                            )}
                          </td>
                          <td>{d.start_time} – {d.end_time}</td>
                          <td>{d.venue}</td>
                          <td><span className="badge badge-assigned">{d.duty_type_name}</span></td>
                          <td>
                            <span className={`badge badge-${d.status}`} style={{textTransform:'capitalize'}}>{d.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
