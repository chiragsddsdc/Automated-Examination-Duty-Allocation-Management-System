// src/pages/admin/Reports.js
import { useState, useEffect } from 'react';
import { allocations, schedules } from '../../utils/api';

export default function Reports() {
  const [allocs, setAllocs] = useState([]);
  const [exams, setExams] = useState([]);
  const [filterExam, setFilterExam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([allocations.getAll(), schedules.getAll()]).then(([a, s]) => {
      setAllocs(a.data);
      setExams(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filterExam ? allocs.filter(a => String(a.exam_id || '') === filterExam || a.subject_name === filterExam) : allocs;

  const grouped = filtered.reduce((acc, a) => {
    const key = `${a.subject_name}__${a.exam_date}`;
    if (!acc[key]) acc[key] = { subject: a.subject_name, date: a.exam_date, venue: a.venue, time: `${a.start_time}–${a.end_time}`, duties: [] };
    acc[key].duties.push(a);
    return acc;
  }, {});

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const headers = ['Faculty Name','Employee ID','Department','Subject','Date','Time','Venue','Duty Type','Status'];
    const rows = filtered.map(a => [
      a.faculty_name, a.employee_id, a.faculty_dept,
      a.subject_name, a.exam_date, `${a.start_time}-${a.end_time}`,
      a.venue, a.duty_type_name, a.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'duty_allocations.csv'; a.click();
  };

  return (
    <>
      <div className="page-header">
        <h2>Reports</h2>
        <p>Generate and download duty allotment reports</p>
      </div>
      <div className="page-body">
        <div className="card mb-4">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <select value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{width:'280px'}}>
                <option value="">All Exams</option>
                {exams.map(e => <option key={e.id} value={e.subject_name}>{e.subject_name} ({new Date(e.exam_date).toLocaleDateString('en-IN')})</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={handleCSV}>⬇ Export CSV</button>
              <button className="btn btn-primary" onClick={handlePrint}>🖨 Print Report</button>
            </div>
          </div>
        </div>

        {loading ? <div className="empty-state"><div className="spinner"></div></div> :
          Object.values(grouped).length === 0 ? (
            <div className="card"><div className="empty-state"><div className="icon">📄</div><p>No allocation data to report</p></div></div>
          ) : (
            Object.values(grouped).map((group, i) => (
              <div key={i} className="card mb-4" id="print-section">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', paddingBottom:'16px', borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <h3 style={{fontSize:'18px', fontWeight:'700'}}>{group.subject}</h3>
                    <div style={{display:'flex', gap:'20px', marginTop:'8px', fontSize:'13px', color:'var(--text-secondary)'}}>
                      <span>📅 {new Date(group.date).toLocaleDateString('en-IN', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</span>
                      <span>🕐 {group.time}</span>
                      <span>📍 {group.venue}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right', fontSize:'13px', color:'var(--text-secondary)'}}>
                    <div>{group.duties.length} Duties Assigned</div>
                  </div>
                </div>
                <table>
                  <thead><tr>
                    <th>#</th><th>Faculty Name</th><th>Employee ID</th>
                    <th>Department</th><th>Duty Type</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {group.duties.map((d, j) => (
                      <tr key={j}>
                        <td style={{color:'var(--text-muted)'}}>{j + 1}</td>
                        <td style={{fontWeight:'600'}}>{d.faculty_name}</td>
                        <td className="font-mono" style={{fontSize:'13px'}}>{d.employee_id}</td>
                        <td>{d.faculty_dept}</td>
                        <td><span className="badge badge-assigned">{d.duty_type_name}</span></td>
                        <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{marginTop:'20px', paddingTop:'16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text-muted)'}}>
                  <span>Generated: {new Date().toLocaleString('en-IN')}</span>
                  <span>Automated Examination Duty Allocation System</span>
                </div>
              </div>
            ))
          )}
      </div>
      <style>{`
        @media print {
          .sidebar, .page-header button, .card-header .btn, select { display: none !important; }
          .main-content { margin-left: 0 !important; }
          body { background: white !important; color: black !important; }
          .card { border: 1px solid #ccc !important; break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
