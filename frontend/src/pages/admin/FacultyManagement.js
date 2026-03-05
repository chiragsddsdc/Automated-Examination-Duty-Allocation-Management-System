// src/pages/admin/FacultyManagement.js
import { useState, useEffect } from 'react';
import { faculty as facultyAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = {
  name:'', email:'', password:'faculty123', employee_id:'',
  department:'', designation:'', experience_years:'', phone:'', max_duties_per_week: 5
};

const departments = ['Computer Science','Mathematics','Physics','Electronics','Chemistry','Mechanical','Civil','Biology','English','Commerce'];
const designations = ['Assistant Professor','Associate Professor','Professor','HOD','Dean'];

export default function FacultyManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    facultyAPI.getAll().then(res => setList(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit = (f) => {
    setForm({ name: f.name, email: f.email, password: '', employee_id: f.employee_id,
      department: f.department, designation: f.designation, experience_years: f.experience_years,
      phone: f.phone, max_duties_per_week: f.max_duties_per_week });
    setEditing(f);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await facultyAPI.update({ ...form, id: editing.id });
        toast.success('Faculty updated');
      } else {
        await facultyAPI.create(form);
        toast.success('Faculty added successfully');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await facultyAPI.delete(id);
      toast.success('Faculty deactivated');
      load();
    } catch { toast.error('Failed to deactivate'); }
  };

  const filtered = list.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.department.toLowerCase().includes(search.toLowerCase()) ||
    f.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h2>Faculty Management</h2>
        <p>Add and manage faculty members for duty allocation</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="search-bar" style={{width:'280px'}}>
              <span>🔍</span>
              <input placeholder="Search faculty..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Faculty</button>
          </div>

          {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Faculty</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Experience</th>
                  <th>Total Duties</th>
                  <th>Max/Week</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8}><div className="empty-state"><div className="icon">👥</div><p>No faculty found</p></div></td></tr>
                  ) : filtered.map(f => (
                    <tr key={f.id}>
                      <td>
                        <div style={{fontWeight:'600'}}>{f.name}</div>
                        <div style={{fontSize:'12px', color:'var(--text-muted)'}}>{f.email}</div>
                      </td>
                      <td><span className="font-mono" style={{fontSize:'13px'}}>{f.employee_id}</span></td>
                      <td>{f.department}</td>
                      <td>{f.designation}</td>
                      <td>{f.experience_years} yrs</td>
                      <td><span style={{color:'var(--accent)', fontWeight:'600'}}>{f.total_duties}</span></td>
                      <td>{f.max_duties_per_week}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(f.id, f.name)}>Remove</button>
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
              <h3>{editing ? 'Edit Faculty' : 'Add New Faculty'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={!!editing} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} required disabled={!!editing} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation *</label>
                  <select value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} required>
                    <option value="">Select designation</option>
                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input type="number" min="0" max="50" value={form.experience_years} onChange={e => setForm({...form, experience_years: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Max Duties/Week</label>
                  <input type="number" min="1" max="10" value={form.max_duties_per_week} onChange={e => setForm({...form, max_duties_per_week: e.target.value})} />
                </div>
              </div>
              {!editing && (
                <div className="form-group">
                  <label>Initial Password</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Default: faculty123" />
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Faculty' : 'Add Faculty'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
