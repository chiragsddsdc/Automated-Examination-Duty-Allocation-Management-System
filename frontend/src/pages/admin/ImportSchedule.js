// src/pages/admin/ImportSchedule.js
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { importSchedules } from '../../utils/api';

// Valid departments that the backend accepts
const DEPARTMENTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Electronics',
  'Chemistry', 'Mechanical', 'Civil', 'Biology', 'English', 'Commerce',
];

export default function ImportSchedule() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);   // holds API response after import
  const inputRef                = useRef(null);

  // ── FILE SELECTION ──────────────────────────────────────────
  const validateAndSet = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      toast.error('Only .xlsx or .xls files are accepted');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5 MB.');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleFileInput = (e) => validateAndSet(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    validateAndSet(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = ()  => setDragging(false);

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── UPLOAD ──────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first'); return; }
    const fd = new FormData();
    fd.append('excel_file', file);
    setLoading(true);
    setResult(null);
    try {
      const res = await importSchedules.upload(fd);
      setResult(res.data);
      if (res.data.imported > 0) {
        toast.success(`${res.data.imported} schedule(s) imported successfully!`);
      } else {
        toast.error('No schedules were imported. Check errors below.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  // ── DOWNLOAD SAMPLE EXCEL ───────────────────────────────────
  // Generates a minimal CSV that Excel can open as a guide
  const downloadSample = () => {
    const header = 'subject_name,subject_code,department,exam_date,start_time,end_time,venue,total_students,duties_required';
    const rows = [
      'Data Structures,CS301,Computer Science,2025-06-10,09:00,12:00,Hall A,60,3',
      'Linear Algebra,MA201,Mathematics,2025-06-11,09:00,12:00,Hall B,45,2',
      'Digital Electronics,EC301,Electronics,2025-06-12,14:00,17:00,Lab 1,40,2',
    ];
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'exam_schedule_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample file downloaded');
  };

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* ── PAGE HEADER ── */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>📥 Import Exam Schedules</h2>
          <p style={s.pageSubtitle}>
            Bulk-import exam schedules from an Excel file (.xlsx / .xls)
          </p>
        </div>
        <button onClick={downloadSample} style={s.sampleBtn}>
          📄 Download Sample File
        </button>
      </div>

      <div className="import-two-col">

        {/* ── LEFT COLUMN: Upload card + Column guide ── */}
        <div style={s.leftCol}>

          {/* Upload card */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Upload Excel File</h3>

            {/* Drop zone */}
            <div
              style={{
                ...s.dropZone,
                ...(dragging ? s.dropZoneActive : {}),
                ...(file    ? s.dropZoneFilled : {}),
              }}
              onClick={() => !file && inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div style={s.fileInfo}>
                  <span style={s.fileIcon}>📊</span>
                  <div>
                    <div style={s.fileName}>{file.name}</div>
                    <div style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); clearFile(); }} style={s.clearBtn} title="Remove file">✕</button>
                </div>
              ) : (
                <>
                  <div style={s.dropIcon}>📂</div>
                  <p style={s.dropText}>Drag &amp; drop your .xlsx file here</p>
                  <p style={s.dropSub}>or click to browse</p>
                  <span style={s.dropBadge}>.xlsx / .xls · max 5 MB</span>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              style={{ ...s.uploadBtn, opacity: (!file || loading) ? 0.6 : 1 }}
            >
              {loading
                ? <><span style={s.spinner} /> Importing...</>
                : '⬆️  Import Schedules'}
            </button>
          </div>

          {/* Column guide */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>📋 Required Column Format</h3>
            <p style={{ ...s.helpText, marginBottom: '12px' }}>
              Row 1 must be the header. Data starts from row 2.
            </p>
            <div style={s.colTable}>
              {[
                { col: 'A', name: 'subject_name',    type: 'Text',    req: true,  note: 'e.g. Data Structures' },
                { col: 'B', name: 'subject_code',    type: 'Text',    req: false, note: 'Auto-generated if blank' },
                { col: 'C', name: 'department',      type: 'Text',    req: true,  note: 'Must match valid dept.' },
                { col: 'D', name: 'exam_date',       type: 'Date',    req: true,  note: 'YYYY-MM-DD or Excel date' },
                { col: 'E', name: 'start_time',      type: 'Time',    req: true,  note: 'HH:MM  (e.g. 09:00)' },
                { col: 'F', name: 'end_time',        type: 'Time',    req: true,  note: 'HH:MM  (e.g. 12:00)' },
                { col: 'G', name: 'venue',           type: 'Text',    req: true,  note: 'e.g. Hall A, Lab 3' },
                { col: 'H', name: 'total_students',  type: 'Number',  req: false, note: 'Defaults to 0' },
                { col: 'I', name: 'duties_required', type: 'Number',  req: false, note: 'Defaults to 2' },
              ].map(({ col, name, type, req, note }) => (
                <div key={col} style={s.colRow}>
                  <span style={s.colLetter}>{col}</span>
                  <span style={s.colName}>{name}</span>
                  <span style={s.colType}>{type}</span>
                  <span style={req ? s.tagReq : s.tagOpt}>{req ? 'Required' : 'Optional'}</span>
                  <span style={s.colNote}>{note}</span>
                </div>
              ))}
            </div>

            {/* Valid departments list */}
            <div style={s.deptBox}>
              <p style={s.deptTitle}>Valid Department Values:</p>
              <div style={s.deptList}>
                {DEPARTMENTS.map(d => <span key={d} style={s.deptChip}>{d}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Results ── */}
        <div style={s.rightCol}>
          {!result ? (
            <div style={s.emptyResult}>
              <div style={s.emptyIcon}>📊</div>
              <p style={s.emptyText}>Import results will appear here</p>
              <p style={s.emptySubText}>Upload an Excel file and click "Import Schedules"</p>
            </div>
          ) : (
            <div style={s.resultWrap}>

              {/* Summary stat cards */}
              <div style={s.statGrid}>
                <StatCard icon="📥" label="Total Rows" value={result.total_rows} color="#3b82f6" />
                <StatCard icon="✅" label="Imported"   value={result.imported}   color="#22c55e" />
                <StatCard icon="⏭️" label="Skipped"    value={result.skipped}    color="#f97316" />
              </div>

              {/* Success / partial / fail banner */}
              {result.imported > 0 && result.skipped === 0 && (
                <div style={{ ...s.banner, ...s.bannerSuccess }}>
                  ✅ All {result.imported} row(s) imported successfully!
                </div>
              )}
              {result.imported > 0 && result.skipped > 0 && (
                <div style={{ ...s.banner, ...s.bannerWarn }}>
                  ⚠️ {result.imported} imported, {result.skipped} skipped due to errors.
                </div>
              )}
              {result.imported === 0 && (
                <div style={{ ...s.banner, ...s.bannerError }}>
                  ❌ No rows imported. Fix the errors below and re-upload.
                </div>
              )}

              {/* Error list */}
              {result.errors?.length > 0 && (
                <div style={s.errCard}>
                  <h4 style={s.errTitle}>⚠️ Row Errors ({result.errors.length})</h4>
                  <div style={s.errList}>
                    {result.errors.map((e, i) => (
                      <div key={i} style={s.errItem}>
                        <span style={s.errBullet}>✕</span>
                        <span style={s.errMsg}>{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import again button */}
              <button onClick={clearFile} style={s.againBtn}>
                📥 Import Another File
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── STAT CARD COMPONENT ─────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
      <div style={s.statIcon}>{icon}</div>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

// ── STYLES ──────────────────────────────────────────────────────
const s = {
  page: {
    padding: '28px',
    maxWidth: '1100px',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    margin: '0 0 6px',
    fontSize: '24px',
    color: 'var(--text-primary, #f1f5f9)',
    fontWeight: '700',
  },
  pageSubtitle: {
    margin: 0,
    color: 'var(--text-secondary, #94a3b8)',
    fontSize: '14px',
  },
  sampleBtn: {
    padding: '10px 18px',
    background: 'transparent',
    border: '1px solid var(--border, #334155)',
    borderRadius: '8px',
    color: 'var(--text-secondary, #94a3b8)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  leftCol:  { display: 'flex', flexDirection: 'column', gap: '24px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: {
    background: 'var(--bg-card, #1e293b)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--border, #334155)',
  },
  cardTitle: {
    margin: '0 0 18px',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary, #f1f5f9)',
  },

  // Drop zone
  dropZone: {
    border: '2px dashed var(--border, #334155)',
    borderRadius: '10px',
    padding: '36px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '18px',
    background: 'var(--bg-input, #0f172a)',
  },
  dropZoneActive: {
    borderColor: '#3b82f6',
    background: 'rgba(59,130,246,0.06)',
  },
  dropZoneFilled: {
    borderColor: '#22c55e',
    borderStyle: 'solid',
    cursor: 'default',
  },
  dropIcon:  { fontSize: '40px', marginBottom: '10px' },
  dropText:  { margin: '0 0 4px', color: 'var(--text-primary, #f1f5f9)', fontSize: '15px', fontWeight: '600' },
  dropSub:   { margin: '0 0 10px', color: 'var(--text-secondary, #94a3b8)', fontSize: '13px' },
  dropBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#334155',
    borderRadius: '20px',
    fontSize: '11px',
    color: '#94a3b8',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    justifyContent: 'center',
  },
  fileIcon: { fontSize: '32px' },
  fileName: { color: 'var(--text-primary, #f1f5f9)', fontWeight: '600', fontSize: '14px' },
  fileSize: { color: '#94a3b8', fontSize: '12px', marginTop: '2px' },
  clearBtn: {
    background: '#334155',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  uploadBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'opacity 0.2s',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  // Column guide table
  colTable: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' },
  colRow: {
    display: 'grid',
    gridTemplateColumns: '24px 160px 60px 72px 1fr',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    background: 'var(--bg-input, #0f172a)',
    borderRadius: '6px',
    fontSize: '12px',
  },
  colLetter: { fontWeight: '700', color: '#3b82f6', textAlign: 'center' },
  colName:   { fontFamily: 'monospace', color: 'var(--text-primary, #f1f5f9)' },
  colType:   { color: '#94a3b8' },
  tagReq:    { background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: '600', textAlign: 'center' },
  tagOpt:    { background: 'rgba(148,163,184,0.12)', color: '#94a3b8', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', textAlign: 'center' },
  colNote:   { color: '#64748b', fontSize: '11px' },
  helpText:  { margin: 0, color: '#94a3b8', fontSize: '13px' },
  deptBox: {
    background: 'var(--bg-input, #0f172a)',
    borderRadius: '8px',
    padding: '14px',
    border: '1px solid var(--border, #334155)',
  },
  deptTitle: { margin: '0 0 10px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' },
  deptList:  { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  deptChip: {
    padding: '3px 10px',
    background: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#93c5fd',
  },

  // Empty state
  emptyResult: {
    background: 'var(--bg-card, #1e293b)',
    borderRadius: '12px',
    border: '1px solid var(--border, #334155)',
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyIcon:    { fontSize: '48px', marginBottom: '16px' },
  emptyText:    { margin: '0 0 8px', color: 'var(--text-primary, #f1f5f9)', fontWeight: '600', fontSize: '16px' },
  emptySubText: { margin: 0, color: '#64748b', fontSize: '13px' },

  // Results
  resultWrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  statCard: {
    background: 'var(--bg-card, #1e293b)',
    border: '1px solid var(--border, #334155)',
    borderRadius: '10px',
    padding: '18px 14px',
    textAlign: 'center',
  },
  statIcon:  { fontSize: '22px', marginBottom: '6px' },
  statValue: { fontSize: '28px', fontWeight: '700', lineHeight: 1 },
  statLabel: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },

  banner: {
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  bannerSuccess: { background: 'rgba(34,197,94,0.12)',  border: '1px solid rgba(34,197,94,0.3)',  color: '#4ade80' },
  bannerWarn:    { background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' },
  bannerError:   { background: 'rgba(239,68,68,0.12)',  border: '1px solid rgba(239,68,68,0.3)',  color: '#f87171' },

  errCard: {
    background: 'var(--bg-card, #1e293b)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    padding: '18px',
  },
  errTitle: { margin: '0 0 14px', color: '#f87171', fontSize: '14px', fontWeight: '700' },
  errList:  { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' },
  errItem:  { display: 'flex', gap: '10px', alignItems: 'flex-start' },
  errBullet:{ color: '#ef4444', fontWeight: '700', flexShrink: 0, marginTop: '1px' },
  errMsg:   { color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' },

  againBtn: {
    padding: '11px 20px',
    background: 'transparent',
    border: '1px solid var(--border, #334155)',
    borderRadius: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
  },
};
