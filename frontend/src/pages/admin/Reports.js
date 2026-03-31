// src/pages/admin/Reports.js
import { useState, useEffect } from 'react';
import { allocations, schedules } from '../../utils/api';

// ── Department colour palette for timetable ──────────────────
const DEPT_COLORS = {
  'Computer Science': { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.45)',  text: '#93c5fd', dot: '#3b82f6' },
  'Mathematics':      { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.45)',   text: '#86efac', dot: '#22c55e' },
  'Physics':          { bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.45)',  text: '#fdba74', dot: '#f97316' },
  'Electronics':      { bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.45)', text: '#d8b4fe', dot: '#a855f7' },
  'Chemistry':        { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.45)',   text: '#fca5a5', dot: '#ef4444' },
  'Civil':            { bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.45)',   text: '#67e8f9', dot: '#06b6d4' },
  'Mechanical':       { bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.45)',   text: '#fde047', dot: '#eab308' },
};
const DEFAULT_COLOR = { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.35)', text: '#94a3b8', dot: '#64748b' };
const getDeptColor  = (dept) => DEPT_COLORS[dept] || DEFAULT_COLOR;

// ── Timetable sub-component ───────────────────────────────────
function TimetableView({ timetableDates, timetableGrid, deptLegend, loading }) {
  if (loading) return <div className="empty-state"><div className="spinner" /></div>;

  if (timetableDates.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="icon">📅</div>
          <p>No exam schedule data available for the timetable</p>
        </div>
      </div>
    );
  }

  const slots = [
    { key: 'morning',   label: 'Morning',   sub: '9:00 AM – 1:00 PM', icon: '🌅' },
    { key: 'afternoon', label: 'Afternoon', sub: '1:00 PM – 5:00 PM', icon: '🌆' },
  ];

  const fmtDate = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return {
      weekday: dt.toLocaleDateString('en-IN', { weekday: 'short' }),
      date:    dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  };

  const minW = Math.max(640, timetableDates.length * 165 + 145);

  return (
    <>
      {/* Legend */}
      {deptLegend.length > 0 && (
        <div className="card mb-4" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Departments:
            </span>
            {deptLegend.map(dept => {
              const c = getDeptColor(dept);
              return (
                <span key={dept} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 11px', borderRadius: '100px',
                  background: c.bg, border: `1px solid ${c.border}`,
                  fontSize: '12px', fontWeight: '500', color: c.text,
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                  {dept}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrollable grid */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${minW}px`, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '140px' }} />
            {timetableDates.map(d => <col key={d} style={{ width: '165px' }} />)}
          </colgroup>

          {/* Date header row */}
          <thead>
            <tr>
              <th style={{
                padding: '14px 16px',
                background: 'var(--bg-secondary, #0f172a)',
                borderBottom: '2px solid var(--border)',
                borderRight: '2px solid var(--border)',
                textAlign: 'left', fontSize: '11px', fontWeight: '700',
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                position: 'sticky', left: 0, zIndex: 3,
              }}>
                Time Slot
              </th>
              {timetableDates.map(d => {
                const { weekday, date } = fmtDate(d);
                return (
                  <th key={d} style={{
                    padding: '10px 12px',
                    background: 'var(--bg-secondary, #0f172a)',
                    borderBottom: '2px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {weekday}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {date}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {slots.map((slot, si) => (
              <tr key={slot.key}>
                {/* Time slot label (sticky left) */}
                <td style={{
                  padding: '14px 14px',
                  borderBottom: si < slots.length - 1 ? '1px solid var(--border)' : 'none',
                  borderRight: '2px solid var(--border)',
                  verticalAlign: 'top',
                  background: 'var(--bg-secondary, #0f172a)',
                  position: 'sticky', left: 0, zIndex: 1,
                  minWidth: '140px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '16px' }}>{slot.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{slot.label}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{slot.sub}</div>
                </td>

                {/* Exam cells */}
                {timetableDates.map(d => {
                  const cellExams = timetableGrid[d]?.[slot.key] || [];
                  return (
                    <td key={d} style={{
                      padding: cellExams.length > 0 ? '10px' : '8px',
                      borderBottom: si < slots.length - 1 ? '1px solid var(--border)' : 'none',
                      borderRight: '1px solid var(--border)',
                      verticalAlign: 'top',
                    }}>
                      {cellExams.length === 0 ? (
                        <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '24px', height: '1px', background: 'var(--border)' }} />
                        </div>
                      ) : (
                        cellExams.map((exam, ei) => {
                          const c = getDeptColor(exam.department);
                          return (
                            <div key={ei} style={{
                              background: c.bg,
                              border: `1px solid ${c.border}`,
                              borderRadius: '8px',
                              padding: '9px 11px',
                              marginBottom: ei < cellExams.length - 1 ? '8px' : '0',
                            }}>
                              {/* Subject name */}
                              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px', lineHeight: '1.35' }}>
                                {exam.subject_name}
                              </div>
                              {/* Subject code */}
                              {exam.subject_code && (
                                <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: '600', color: c.text, marginBottom: '5px' }}>
                                  {exam.subject_code}
                                </div>
                              )}
                              {/* Venue + time */}
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                📍 {exam.venue}&nbsp;&nbsp;
                                🕐 {exam.start_time?.slice(0,5)} – {exam.end_time?.slice(0,5)}
                              </div>
                              {/* Assigned faculty */}
                              {exam.faculty.length > 0 ? (
                                <div style={{ paddingTop: '6px', borderTop: `1px solid ${c.border}` }}>
                                  <div style={{ fontSize: '10px', fontWeight: '700', color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    Assigned
                                  </div>
                                  {exam.faculty.slice(0, 3).map((f, fi) => (
                                    <div key={fi} style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                      · {f}
                                    </div>
                                  ))}
                                  {exam.faculty.length > 3 && (
                                    <div style={{ fontSize: '10px', color: c.text, marginTop: '2px', fontWeight: '600' }}>
                                      +{exam.faculty.length - 3} more
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ paddingTop: '5px', borderTop: `1px solid ${c.border}`, fontSize: '10px', color: '#f59e0b', fontWeight: '600' }}>
                                  ⚠ No faculty assigned
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Reports() {
  const [allocs, setAllocs]       = useState([]);
  const [exams, setExams]         = useState([]);
  const [filterExam, setFilterExam] = useState('');
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('report');

  useEffect(() => {
    Promise.all([allocations.getAll(), schedules.getAll()]).then(([a, s]) => {
      setAllocs(a.data);
      setExams(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filterExam
    ? allocs.filter(a => String(a.exam_id || '') === filterExam || a.subject_name === filterExam)
    : allocs;

  const grouped = filtered.reduce((acc, a) => {
    const key = `${a.subject_name}__${a.exam_date}`;
    if (!acc[key]) acc[key] = {
      subject: a.subject_name, date: a.exam_date, venue: a.venue,
      time: `${a.start_time}–${a.end_time}`, duties: [],
    };
    acc[key].duties.push(a);
    return acc;
  }, {});

  // ── PDF Duty Slips ─────────────────────────────────────────
  const handlePDF = () => {
    // Group allocations by faculty member
    const byFaculty = {};
    filtered.forEach(a => {
      const key = a.employee_id || a.faculty_name;
      if (!byFaculty[key]) byFaculty[key] = {
        name:        a.faculty_name   || '—',
        employee_id: a.employee_id    || '—',
        department:  a.faculty_dept   || '—',
        designation: a.designation    || '—',
        duties:      [],
      };
      byFaculty[key].duties.push(a);
    });

    const slips = Object.values(byFaculty);
    if (slips.length === 0) { alert('No allocation data to export.'); return; }

    const genDate = new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const slipHTML = slips.map((f, idx) => `
      <div class="slip${idx < slips.length - 1 ? ' page-break' : ''}">

        <div class="slip-header">
          <div class="institution">Examination Duty Management System</div>
          <div class="institution-sub">Automated Duty Allocation Portal · Academic Year 2024–25</div>
          <div class="slip-title">EXAMINATION DUTY ALLOCATION SLIP</div>
        </div>

        <table class="info-table">
          <tr>
            <td class="lbl">Faculty Name</td>
            <td class="val"><strong>${f.name}</strong></td>
            <td class="lbl">Employee ID</td>
            <td class="val"><strong>${f.employee_id}</strong></td>
          </tr>
          <tr>
            <td class="lbl">Department</td>
            <td class="val">${f.department}</td>
            <td class="lbl">Designation</td>
            <td class="val">${f.designation}</td>
          </tr>
        </table>

        <div class="section-label">Assigned Examination Duties</div>
        <table class="duties-table">
          <thead>
            <tr>
              <th>#</th><th>Exam Date</th><th>Subject</th>
              <th>Time</th><th>Venue</th><th>Duty Type</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${f.duties.map((d, i) => `
              <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
                <td>${i + 1}</td>
                <td>${d.exam_date ? new Date(d.exam_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                <td>${d.subject_name || '—'}</td>
                <td>${d.start_time ? d.start_time.slice(0,5) : '—'} – ${d.end_time ? d.end_time.slice(0,5) : '—'}</td>
                <td>${d.venue || '—'}</td>
                <td>${d.duty_type_name || '—'}</td>
                <td>${d.status || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="slip-footer">
          <div class="gen-date">Generated: ${genDate}</div>
          <div class="sig-row">
            <div class="sig-block"><div class="sig-line"></div><div class="sig-lbl">Faculty Signature &amp; Date</div></div>
            <div class="sig-block"><div class="sig-line"></div><div class="sig-lbl">Head of Department</div></div>
            <div class="sig-block"><div class="sig-line"></div><div class="sig-lbl">Examination Controller</div></div>
          </div>
        </div>

      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Duty Allocation Slips – Exam Duty System</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Times New Roman',Times,serif; font-size:11.5pt; color:#111; background:#fff; }

  .slip { max-width:730px; margin:0 auto; padding:28px 32px; }
  .page-break { page-break-after:always; border-bottom:2px dashed #b0b8c8; margin-bottom:32px; padding-bottom:32px; }

  /* Header */
  .slip-header { text-align:center; background:#f0f5fb; border:2px solid #1e3a5f; border-radius:4px; padding:18px 24px; margin-bottom:18px; }
  .institution { font-size:17pt; font-weight:bold; color:#1e3a5f; letter-spacing:0.3px; }
  .institution-sub { font-size:9pt; color:#555; margin-top:4px; }
  .slip-title { margin-top:12px; padding-top:10px; border-top:1px solid #c0cfe0; font-size:12.5pt; font-weight:bold; color:#1e3a5f; text-transform:uppercase; letter-spacing:1.2px; }

  /* Info table */
  .info-table { width:100%; border-collapse:collapse; border:1px solid #1e3a5f; margin-bottom:18px; }
  .info-table tr { border-bottom:1px solid #c8d8ea; }
  .info-table tr:last-child { border-bottom:none; }
  .lbl { background:#eef3fa; padding:9px 14px; font-size:9pt; font-weight:bold; color:#2d5080; text-transform:uppercase; letter-spacing:0.4px; width:17%; white-space:nowrap; }
  .val { padding:9px 14px; font-size:11pt; width:33%; }

  /* Duties section */
  .section-label { font-size:10pt; font-weight:bold; color:#1e3a5f; text-transform:uppercase; letter-spacing:0.6px; border-bottom:2.5px solid #1e3a5f; padding-bottom:5px; margin-bottom:10px; }
  .duties-table { width:100%; border-collapse:collapse; font-size:10.5pt; margin-bottom:20px; }
  .duties-table thead tr { background:#1e3a5f; color:#fff; }
  .duties-table th { padding:9px 10px; text-align:left; font-size:9pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.3px; border:1px solid #1a3356; }
  .duties-table td { padding:8px 10px; border:1px solid #d0dcea; vertical-align:top; }
  .even { background:#f5f9ff; }
  .odd  { background:#fff; }

  /* Footer */
  .slip-footer { border-top:1px solid #c8d8ea; padding-top:14px; }
  .gen-date { font-size:9pt; color:#888; margin-bottom:28px; }
  .sig-row { display:flex; justify-content:space-between; gap:24px; }
  .sig-block { flex:1; text-align:center; }
  .sig-line { border-top:1px solid #111; margin-bottom:7px; }
  .sig-lbl { font-size:9pt; color:#333; }

  @media print {
    body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    .slip { padding:16px 24px; }
    .page-break { border-bottom:none; margin-bottom:0; padding-bottom:0; }
  }
</style>
</head>
<body>
${slipHTML}
<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('Please allow pop-ups for this site to generate PDF.'); return; }
    win.document.write(html);
    win.document.close();
  };

  // ── Excel (.xlsx) Export ───────────────────────────────────
  const handleExcel = () => {
    const doExport = () => {
      const XLSX = window.XLSXStyle || window.XLSX;
      if (!XLSX) { alert('Excel library could not load. Please check your connection and try again.'); return; }

      const HEADER_STYLE = {
        font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill:      { fgColor: { rgb: '1E3A5F' }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top:    { style: 'thin', color: { rgb: '2D6A9F' } },
          bottom: { style: 'thin', color: { rgb: '2D6A9F' } },
          left:   { style: 'thin', color: { rgb: '2D6A9F' } },
          right:  { style: 'thin', color: { rgb: '2D6A9F' } },
        },
      };
      const ALT_ROW_STYLE = {
        fill:   { fgColor: { rgb: 'EEF3FA' }, patternType: 'solid' },
        border: {
          top:    { style: 'thin', color: { rgb: 'DDE6EF' } },
          bottom: { style: 'thin', color: { rgb: 'DDE6EF' } },
          left:   { style: 'thin', color: { rgb: 'DDE6EF' } },
          right:  { style: 'thin', color: { rgb: 'DDE6EF' } },
        },
      };
      const CELL_BORDER = {
        border: {
          top:    { style: 'thin', color: { rgb: 'DDE6EF' } },
          bottom: { style: 'thin', color: { rgb: 'DDE6EF' } },
          left:   { style: 'thin', color: { rgb: 'DDE6EF' } },
          right:  { style: 'thin', color: { rgb: 'DDE6EF' } },
        },
      };

      // ── Sheet 1: Duty Allocations ──────────────────────────
      const headers = [
        'Faculty Name', 'Employee ID', 'Department', 'Subject',
        'Exam Date', 'Start Time', 'End Time', 'Venue', 'Duty Type', 'Status',
      ];
      const rows = filtered.map(a => [
        a.faculty_name   || '',
        a.employee_id    || '',
        a.faculty_dept   || '',
        a.subject_name   || '',
        a.exam_date      || '',
        a.start_time     ? a.start_time.slice(0, 5) : '',
        a.end_time       ? a.end_time.slice(0, 5)   : '',
        a.venue          || '',
        a.duty_type_name || '',
        a.status         || '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Column widths
      ws['!cols'] = [
        { wch: 26 }, { wch: 14 }, { wch: 22 }, { wch: 28 },
        { wch: 13 }, { wch: 11 }, { wch: 10 }, { wch: 16 },
        { wch: 16 }, { wch: 12 },
      ];
      // Header row height
      ws['!rows'] = [{ hpt: 22 }];

      const COLS = ['A','B','C','D','E','F','G','H','I','J'];

      // Style header row
      COLS.forEach(col => {
        const ref = `${col}1`;
        if (ws[ref]) ws[ref].s = HEADER_STYLE;
      });

      // Style data rows (alternating)
      rows.forEach((_, i) => {
        COLS.forEach(col => {
          const ref = `${col}${i + 2}`;
          if (ws[ref]) ws[ref].s = i % 2 === 1 ? ALT_ROW_STYLE : CELL_BORDER;
        });
      });

      // ── Sheet 2: Summary ──────────────────────────────────
      const deptTotals = {};
      const statusTotals = {};
      filtered.forEach(a => {
        const d = a.faculty_dept    || 'Unknown';
        const s = a.status          || 'Unknown';
        deptTotals[d]   = (deptTotals[d]   || 0) + 1;
        statusTotals[s] = (statusTotals[s] || 0) + 1;
      });

      const summaryRows = [
        ['DUTY ALLOCATION SUMMARY REPORT'],
        [`Generated: ${new Date().toLocaleString('en-IN')}`],
        [],
        ['BY DEPARTMENT', '', 'BY STATUS', ''],
        ['Department', 'Total Duties', 'Status', 'Count'],
        ...(() => {
          const dA = Object.entries(deptTotals);
          const sA = Object.entries(statusTotals);
          const len = Math.max(dA.length, sA.length);
          return Array.from({ length: len }, (_, i) => [
            dA[i]?.[0] ?? '', dA[i]?.[1] ?? '',
            sA[i]?.[0] ?? '', sA[i]?.[1] ?? '',
          ]);
        })(),
        [],
        ['TOTAL ALLOCATIONS', filtered.length, '', ''],
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
      ws2['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 14 }];

      if (ws2['A1']) ws2['A1'].s = { font: { bold: true, sz: 14, color: { rgb: '1E3A5F' } } };
      ['A4','B4','C4','D4','A5','B5','C5','D5'].forEach(ref => {
        if (ws2[ref]) ws2[ref].s = HEADER_STYLE;
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws,  'Duty Allocations');
      XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
      XLSX.writeFile(wb, 'duty_allocations.xlsx');
    };

    // Prefer xlsx-js-style (supports full cell styling), fall back to standard xlsx
    if (window.XLSXStyle || window.XLSX) {
      doExport();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
      script.onload = () => { window.XLSX = window.XLSXStyle || window.XLSX; doExport(); };
      script.onerror = () => {
        // Fallback: load plain SheetJS (no cell colours, but still valid .xlsx)
        const s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s2.onload = doExport;
        document.head.appendChild(s2);
      };
      document.head.appendChild(script);
    }
  };

  // ── CSV Export (unchanged) ─────────────────────────────────
  const handleCSV = () => {
    const headers = ['Faculty Name','Employee ID','Department','Subject','Date','Time','Venue','Duty Type','Status'];
    const rows = filtered.map(a => [
      a.faculty_name, a.employee_id, a.faculty_dept,
      a.subject_name, a.exam_date, `${a.start_time}-${a.end_time}`,
      a.venue, a.duty_type_name, a.status,
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'duty_allocations.csv'; a.click();
  };

  const handlePrint = () => window.print();

  // ── Timetable data prep ────────────────────────────────────
  const examFacultyMap = {};
  allocs.forEach(a => {
    if (!examFacultyMap[a.exam_id]) examFacultyMap[a.exam_id] = [];
    if (a.faculty_name && !examFacultyMap[a.exam_id].includes(a.faculty_name))
      examFacultyMap[a.exam_id].push(a.faculty_name);
  });

  const timetableDates = [...new Set(exams.map(e => e.exam_date))].sort();

  const timetableGrid = {};
  timetableDates.forEach(d => { timetableGrid[d] = { morning: [], afternoon: [] }; });
  exams.forEach(exam => {
    const hour = parseInt((exam.start_time || '09:00').split(':')[0]);
    const slot = hour < 13 ? 'morning' : 'afternoon';
    if (timetableGrid[exam.exam_date]) {
      timetableGrid[exam.exam_date][slot].push({
        ...exam,
        faculty: examFacultyMap[exam.id] || [],
      });
    }
  });

  const deptLegend = [...new Set(exams.map(e => e.department).filter(Boolean))];

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <div className="page-header">
        <h2>Reports</h2>
        <p>Generate and download duty allotment reports</p>
      </div>

      <div className="page-body">

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '20px',
          background: 'var(--bg-card)', borderRadius: '10px',
          padding: '4px', width: 'fit-content',
          border: '1px solid var(--border)',
        }}>
          {[
            { id: 'report',    label: '📋 Duty Report'    },
            { id: 'timetable', label: '📅 Timetable View' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px', borderRadius: '7px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                fontFamily: 'inherit', transition: 'all 0.18s',
                background: activeTab === tab.id ? 'var(--accent, #2d6a9f)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── DUTY REPORT TAB ─────────────────────────────── */}
        {activeTab === 'report' && (
          <>
            <div className="card mb-4">
              <div className="card-header">
                {/* Exam filter */}
                <div className="flex items-center gap-3">
                  <select
                    value={filterExam}
                    onChange={e => setFilterExam(e.target.value)}
                    style={{ width: '280px' }}
                  >
                    <option value="">All Exams</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.subject_name}>
                        {e.subject_name} ({new Date(e.exam_date + 'T00:00:00').toLocaleDateString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export buttons */}
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCSV}
                    title="Export as plain CSV"
                  >
                    ⬇ CSV
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={handleExcel}
                    title="Export as formatted Excel (.xlsx) with coloured headers"
                    style={{
                      background: 'rgba(34,197,94,0.12)',
                      color: '#4ade80',
                      border: '1px solid rgba(34,197,94,0.3)',
                    }}
                  >
                    📊 Excel (.xlsx)
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={handlePDF}
                    title="Open printable duty slips for each faculty member"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.28)',
                    }}
                  >
                    📄 Duty Slips PDF
                  </button>

                  <button className="btn btn-primary" onClick={handlePrint}>
                    🖨 Print
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="empty-state"><div className="spinner" /></div>
            ) : Object.values(grouped).length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="icon">📄</div>
                  <p>No allocation data to report</p>
                </div>
              </div>
            ) : (
              Object.values(grouped).map((group, i) => (
                <div key={i} className="card mb-4" id="print-section">
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '16px',
                    paddingBottom: '16px', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{group.subject}</h3>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span>📅 {new Date(group.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>🕐 {group.time}</span>
                        <span>📍 {group.venue}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {group.duties.length} Duties Assigned
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Faculty Name</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Duty Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.duties.map((d, j) => (
                        <tr key={j}>
                          <td style={{ color: 'var(--text-muted)' }}>{j + 1}</td>
                          <td style={{ fontWeight: '600' }}>{d.faculty_name}</td>
                          <td className="font-mono" style={{ fontSize: '13px' }}>{d.employee_id}</td>
                          <td>{d.faculty_dept}</td>
                          <td><span className="badge badge-assigned">{d.duty_type_name}</span></td>
                          <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{
                    marginTop: '20px', paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '12px', color: 'var(--text-muted)',
                  }}>
                    <span>Generated: {new Date().toLocaleString('en-IN')}</span>
                    <span>Automated Examination Duty Allocation System</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── TIMETABLE TAB ───────────────────────────────── */}
        {activeTab === 'timetable' && (
          <TimetableView
            timetableDates={timetableDates}
            timetableGrid={timetableGrid}
            deptLegend={deptLegend}
            loading={loading}
          />
        )}

      </div>

      <style>{`
        @media print {
          .sidebar, .page-header button, .card-header .btn,
          select, .card-header { display: none !important; }
          .main-content { margin-left: 0 !important; }
          body { background: white !important; color: black !important; }
          .card { border: 1px solid #ccc !important; break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
