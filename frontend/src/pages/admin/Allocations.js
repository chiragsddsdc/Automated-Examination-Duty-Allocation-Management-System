// src/pages/admin/Allocations.js
import { useState, useEffect } from 'react';
import { allocations } from '../../utils/api';
import toast from 'react-hot-toast';

const statusColors = { assigned:'badge-assigned', acknowledged:'badge-acknowledged', completed:'badge-completed', absent:'badge-cancelled' };

export default function Allocations() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    allocations.getAll().then(res => setList(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await allocations.update({ id, status });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this allocation?')) return;
    try {
      await allocations.delete(id);
      toast.success('Allocation removed');
      load();
    } catch { toast.error('Failed to remove'); }
  };

  const filtered = list.filter(a =>
    a.faculty_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.venue?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h2>All Allocations</h2>
        <p>View and manage all duty allocations across all exams</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="search-bar" style={{width:'280px'}}>
              <span>🔍</span>
              <input placeholder="Search allocations..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={{fontSize:'14px', color:'var(--text-secondary)'}}>{filtered.length} records</span>
          </div>
          {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Faculty</th><th>Dept</th><th>Subject</th>
                  <th>Date</th><th>Time</th><th>Venue</th>
                  <th>Duty Type</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9}><div className="empty-state"><div className="icon">📋</div><p>No allocations found</p></div></td></tr>
                  ) : filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{fontWeight:'600'}}>{a.faculty_name}</div>
                        <div style={{fontSize:'12px', color:'var(--text-muted)'}}>{a.employee_id}</div>
                      </td>
                      <td style={{fontSize:'13px'}}>{a.faculty_dept}</td>
                      <td style={{fontWeight:'500'}}>{a.subject_name}</td>
                      <td>{new Date(a.exam_date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</td>
                      <td style={{fontSize:'13px'}}>{a.start_time}–{a.end_time}</td>
                      <td>{a.venue}</td>
                      <td><span className="badge badge-assigned">{a.duty_type_name}</span></td>
                      <td>
                        <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)}
                          style={{padding:'5px 8px', fontSize:'12px', width:'130px'}}>
                          <option value="assigned">Assigned</option>
                          <option value="acknowledged">Acknowledged</option>
                          <option value="completed">Completed</option>
                          <option value="absent">Absent</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(a.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
