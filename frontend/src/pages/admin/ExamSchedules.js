// src/pages/admin/ExamSchedules.js
import { useState, useEffect } from 'react';
import { schedules as api } from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = {
  subject_name:'', subject_code:'', department:'', exam_date:'',
  start_time:'09:00', end_time:'12:00', venue:'', total_students:'', duties_required:2, status:'scheduled'
};

const departments = ['Computer Science','Mathematics','Physics','Electronics','Chemistry','Mechanical','Civil','Biology'];
const statusColors = { scheduled:'badge-scheduled', ongoing:'badge-ongoing', completed:'badge-completed', cancelled:'badge-cancelled' };

export default function ExamSchedules() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getAll().then(res => setList(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit = (s) => {
    setForm({ ...s, exam_date: s.exam_date?.split('T')[0] });
    setEditing(s);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.update({ ...form, id: editing.id });
        toast.success('Schedule updated');
      } else {
        await api.create(form);
        toast.success('Exam schedule created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete exam "${name}"?`)) return;
    try {
      await api.delete(id);
      toast.success('Exam deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({...form, [k]: e.target.value}) });

  return (
    <>
      <div className="page-header">
        <h2>Exam Schedules</h2>
        <p>Manage examination timetables and venues</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">All Scheduled Exams ({list.length})</h3>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Exam</button>
          </div>
          {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Subject</th><th>Code</th><th>Department</th>
                  <th>Date</th><th>Time</th><th>Venue</th>
                  <th>Students</th><th>Duties</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={10}><div className="empty-state"><div className="icon">📅</div><p>No exams scheduled</p></div></td></tr>
                  ) : list.map(s => (
                    <tr key={s.id}>
                      <td style={{fontWeight:'600'}}>{s.subject_name}</td>
                      <td><span className="font-mono" style={{fontSize:'13px'}}>{s.subject_code}</span></td>
                      <td>{s.department}</td>
                      <td>{new Date(s.exam_date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</td>
                      <td style={{fontSize:'13px'}}>{s.start_time} – {s.end_time}</td>
                      <td>{s.venue}</td>
                      <td style={{textAlign:'center'}}>{s.total_students}</td>
                      <td style={{textAlign:'center'}}>
                        <span style={{color: s.allocated_duties >= s.duties_required ? 'var(--success)' : 'var(--warning)'}}>
                          {s.allocated_duties}/{s.duties_required}
                        </span>
                      </td>
                      <td><span className={`badge ${statusColors[s.status] || ''}`}>{s.status}</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(s.id, s.subject_name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>{editing ? 'Edit Exam' : 'Add Exam Schedule'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject Name *</label>
                  <input {...f('subject_name')} required />
                </div>
                <div className="form-group">
                  <label>Subject Code *</label>
                  <input {...f('subject_code')} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select {...f('department')} required>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Venue *</label>
                  <input {...f('venue')} placeholder="Hall A, Room 101..." required />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Exam Date *</label>
                  <input type="date" {...f('exam_date')} required />
                </div>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="time" {...f('start_time')} required />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input type="time" {...f('end_time')} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Students *</label>
                  <input type="number" min="1" {...f('total_students')} required />
                </div>
                <div className="form-group">
                  <label>Duties Required *</label>
                  <input type="number" min="1" max="10" {...f('duties_required')} required />
                </div>
              </div>
              {editing && (
                <div className="form-group">
                  <label>Status</label>
                  <select {...f('status')}>
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
