// src/pages/faculty/Availability.js
import { useState, useEffect } from 'react';
import { availability as api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Availability() {
  const { user } = useAuth();
  const [existing, setExisting] = useState([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isAvailable, setIsAvailable] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const facultyId = user?.faculty_profile_id;

  const load = () => {
    if (facultyId) api.get(facultyId).then(res => setExisting(res.data));
  };

  useEffect(() => { load(); }, [facultyId]);

  const save = async (e) => {
    e.preventDefault();
    if (!facultyId) return toast.error('Faculty profile not found');
    setSaving(true);
    try {
      await api.save({
        faculty_id: facultyId,
        slots: [{ date, start_time: startTime, end_time: endTime, is_available: isAvailable ? 1 : 0, reason }]
      });
      toast.success(isAvailable ? 'Marked as unavailable' : 'Availability saved');
      setDate(''); setReason('');
      load();
    } catch {
      toast.error('Failed to save availability');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    await api.delete(id);
    toast.success('Removed');
    load();
  };

  const unavailable = existing.filter(e => e.is_available === 0 || e.is_available === '0');

  return (
    <>
      <div className="page-header">
        <h2>My Availability</h2>
        <p>Mark dates when you are unavailable for exam duties</p>
      </div>
      <div className="page-body">
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Mark Unavailability</h3>
            </div>
            <p style={{fontSize:'14px', color:'var(--text-secondary)', marginBottom:'20px'}}>
              If you have a prior commitment, mark yourself as unavailable. The system will skip you for duties on that date.
            </p>
            <form onSubmit={save}>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>From Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>To Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Reason (optional)</label>
                <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Conference, leave, personal..." />
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={saving}>
                {saving ? 'Saving...' : '🚫 Mark as Unavailable'}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Unavailable Dates ({unavailable.length})</h3>
            </div>
            {unavailable.length === 0 ? (
              <div className="empty-state">
                <div className="icon">✅</div>
                <p>You're available for all dates</p>
              </div>
            ) : unavailable.map(a => (
              <div key={a.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px', borderBottom:'1px solid var(--border)', borderRadius:'8px'}}>
                <div>
                  <div style={{fontWeight:'600', fontSize:'14px'}}>
                    {new Date(a.available_date).toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'})}
                  </div>
                  <div style={{fontSize:'12px', color:'var(--text-muted)'}}>
                    {a.start_time} – {a.end_time}
                    {a.reason && <span> • {a.reason}</span>}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => remove(a.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
