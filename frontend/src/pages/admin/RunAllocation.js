// src/pages/admin/RunAllocation.js
import { useState, useEffect } from 'react';
import { allocations, schedules } from '../../utils/api';
import toast from 'react-hot-toast';

export default function RunAllocation() {
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState([]);
  const [overwrite, setOverwrite] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    schedules.getAll().then(res => {
      const upcoming = res.data.filter(e => e.status === 'scheduled');
      setExams(upcoming);
    });
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === exams.length ? [] : exams.map(e => e.id));
  };

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await allocations.run({ exam_ids: selected, overwrite });
      setResult(res.data);
      toast.success('Allocation completed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Allocation failed');
    } finally { setRunning(false); }
  };

  return (
    <>
      <div className="page-header">
        <h2>⚡ Run Auto Allocation</h2>
        <p>Automatically assign exam duties to faculty using smart constraint-based algorithm</p>
      </div>
      <div className="page-body">
        <div className="grid-2">
          <div>
            <div className="card mb-4">
              <div className="card-header">
                <h3 className="card-title">Algorithm Info</h3>
              </div>
              <div style={{fontSize:'14px', color:'var(--text-secondary)', lineHeight:'1.8'}}>
                <p style={{marginBottom:'12px'}}>The system uses a <strong style={{color:'var(--accent)'}}>Weighted Round-Robin</strong> algorithm with the following rules:</p>
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[
                    ['🚫', 'Faculty cannot invigilate their own department\'s exam'],
                    ['⏰', 'No time conflicts — faculty cannot be double-booked'],
                    ['📊', 'Maximum weekly duty limit is respected per faculty'],
                    ['❌', 'Faculty marked unavailable are skipped'],
                    ['⚖️', 'Least-loaded faculty are prioritized for fair distribution'],
                    ['🎯', 'Duty types (invigilation, supervision etc.) are rotated']
                  ].map(([icon, text]) => (
                    <div key={text} style={{display:'flex', gap:'10px', padding:'8px', background:'var(--bg-secondary)', borderRadius:'8px'}}>
                      <span>{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Options</h3>
              </div>
              <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontSize:'14px'}}>
                <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)}
                  style={{width:'16px', height:'16px', accentColor:'var(--accent)'}} />
                <span>
                  <strong>Overwrite existing allocations</strong>
                  <br /><span style={{color:'var(--text-muted)', fontSize:'13px'}}>Re-run allocation even for already allocated exams</span>
                </span>
              </label>

              <div style={{marginTop:'20px'}}>
                <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'14px', fontSize:'15px'}}
                  onClick={run} disabled={running || exams.length === 0}>
                  {running ? '⚙️ Running Algorithm...' : `⚡ Run Allocation (${selected.length || exams.length} exams)`}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Select Exams ({exams.length} scheduled)</h3>
                <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
                  {selected.length === exams.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {exams.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">📅</div>
                  <p>No scheduled exams found</p>
                </div>
              ) : (
                <div style={{maxHeight:'400px', overflowY:'auto'}}>
                  {exams.map(exam => (
                    <div key={exam.id}
                      style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px',
                        borderBottom:'1px solid var(--border)', cursor:'pointer',
                        background: selected.includes(exam.id) ? 'rgba(79,140,255,0.06)' : 'transparent',
                        borderRadius:'8px', marginBottom:'2px'}}
                      onClick={() => toggleSelect(exam.id)}>
                      <input type="checkbox" checked={selected.includes(exam.id)} readOnly
                        style={{accentColor:'var(--accent)', width:'16px', height:'16px'}} />
                      <div style={{flex:1}}>
                        <div style={{fontWeight:'600', fontSize:'14px'}}>{exam.subject_name}</div>
                        <div style={{fontSize:'12px', color:'var(--text-muted)'}}>
                          {exam.department} • {new Date(exam.exam_date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})} • {exam.venue}
                        </div>
                      </div>
                      <span style={{fontSize:'12px', color: exam.allocated_duties >= exam.duties_required ? 'var(--success)' : 'var(--warning)'}}>
                        {exam.allocated_duties}/{exam.duties_required} filled
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {result && (
          <div className={`alloc-result ${result.summary?.failed > 0 ? 'warning' : 'success'}`} style={{marginTop:'24px'}}>
            <h4>✅ Allocation Results</h4>
            <div className="alloc-summary-grid">
              {[
                ['Total Exams', result.summary.total_exams, 'var(--text-primary)'],
                ['Successfully Allocated', result.summary.successfully_allocated, 'var(--success)'],
                ['Skipped (already done)', result.summary.skipped, 'var(--text-secondary)'],
                ['Failed', result.summary.failed, result.summary.failed > 0 ? 'var(--danger)' : 'var(--text-secondary)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{textAlign:'center', padding:'12px', background:'var(--bg-secondary)', borderRadius:'8px'}}>
                  <div style={{fontSize:'22px', fontWeight:'700', color, fontFamily:'JetBrains Mono'}}>{val}</div>
                  <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'4px'}}>{label}</div>
                </div>
              ))}
            </div>
            {result.allocated?.length > 0 && (
              <>
                <h4 style={{marginBottom:'8px'}}>✓ Allocated:</h4>
                <ul>{result.allocated.map((a, i) => (
                  <li key={i}>{a.exam} ({a.date}) — {a.assigned}/{a.required} duties assigned</li>
                ))}</ul>
              </>
            )}
            {result.errors?.length > 0 && (
              <>
                <h4 style={{marginTop:'12px', marginBottom:'8px', color:'var(--warning)'}}>⚠ Issues:</h4>
                <ul>{result.errors.map((e, i) => <li key={i} style={{color:'var(--warning)'}}>{e}</li>)}</ul>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
