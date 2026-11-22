/**
 * TeacherAttendance.js
 * ─────────────────────
 * Three-tab teacher attendance panel:
 *  Tab 1 — View Records  : filterable, exportable attendance table
 *  Tab 2 — Manual Mark   : per-student Present/Absent/Late + remarks
 *  Tab 3 — Student List  : full enrolled-student breakdown with face status
 */
import React, { useState, useEffect, useCallback } from 'react';
import { classService, attendanceService } from '../../services/api.service';
import AttendanceTable from '../shared/AttendanceTable';
import Button          from '../shared/Button';
import toast           from 'react-hot-toast';
import { format }      from 'date-fns';

const TABS = [
  { id:'view',   label:'📋 View Records' },
  { id:'manual', label:'✍️ Manual Attendance' },
  { id:'list',   label:'👥 Student List' },
];

const TeacherAttendance = () => {
  const [activeTab,     setActiveTab]     = useState('view');
  const [classes,       setClasses]       = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classData,     setClassData]     = useState(null);

  useEffect(() => {
    classService.getAll().then((r) => setClasses(r.data.classes || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) { setClassData(null); return; }
    classService.getById(selectedClass)
      .then((r) => setClassData(r.data.class))
      .catch(() => setClassData(null));
  }, [selectedClass]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ── Class selector ── */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.1rem 1.25rem', display:'flex', gap:'1rem', alignItems:'flex-end', flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 240px' }}>
          <label style={LS}>Select Class</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ padding:'0.55rem 0.8rem' }}>
            <option value="">— Choose a class —</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name} — {c.subject}</option>
            ))}
          </select>
        </div>
        {classData && (
          <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', alignItems:'center' }}>
            <Pill bg="var(--accent-glow)" color="var(--accent-light)">{classData.students?.length||0} students</Pill>
            <Pill bg="var(--success-bg)"  color="var(--success)">Code: {classData.joinCode}</Pill>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:'0.25rem', background:'var(--bg-secondary)', padding:4, borderRadius:'var(--radius-lg)', width:'fit-content' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:'0.5rem 1.1rem', borderRadius:10, fontFamily:'var(--font-body)',
            fontWeight:600, fontSize:'0.85rem', cursor:'pointer', transition:'all 0.18s',
            background: activeTab===t.id ? 'var(--bg-card)' : 'transparent',
            color: activeTab===t.id ? 'var(--accent-light)' : 'var(--text-muted)',
            border: activeTab===t.id ? '1px solid var(--border)' : '1px solid transparent',
            boxShadow: activeTab===t.id ? 'var(--shadow-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'view'   && <ViewRecordsTab   classId={selectedClass} />}
      {activeTab === 'manual' && <ManualAttendanceTab classId={selectedClass} classData={classData} />}
      {activeTab === 'list'   && <StudentListTab   classId={selectedClass} classData={classData} />}
    </div>
  );
};

// ─── TAB 1: View Records ──────────────────────────────────────────────────────
const ViewRecordsTab = ({ classId }) => {
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [filters,   setFilters]   = useState({ date:'', from:'', to:'' });
  const [exporting, setExporting] = useState(false);
  const [savedBanner, setSavedBanner] = useState(null);

  const fetchRecords = useCallback(async () => {
    if (!classId) { setRecords([]); return; }
    try {
      setLoading(true);
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.from) params.from = filters.from;
      if (filters.to)   params.to   = filters.to;
      const res = await attendanceService.getByClass(classId, params);
      setRecords(res.data.records || []);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [classId, filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setSavedBanner(null);
      const params = { classId };
      if (filters.from) params.from = filters.from;
      if (filters.to)   params.to   = filters.to;
      if (filters.date) params.date = filters.date;

      const res = await attendanceService.export(params);
      const { data, savedAs, savedPath } = res.data;

      // Trigger browser download
      if (data?.length) {
        const headers = Object.keys(data[0]).join(',');
        const rows    = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(',')).join('\n');
        const blob    = new Blob([`${headers}\n${rows}`], { type:'text/csv;charset=utf-8;' });
        const url     = URL.createObjectURL(blob);
        const a       = document.createElement('a');
        a.href     = url;
        a.download = savedAs || `attendance_${classId}_${format(new Date(),'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setSavedBanner({ savedAs, savedPath, count: data?.length || 0 });
      toast.success(`Exported ${data?.length || 0} records`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Filters + export */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.1rem 1.25rem', display:'flex', flexWrap:'wrap', gap:'0.75rem', alignItems:'flex-end' }}>
        <div><label style={LS}>Date</label>
          <input type="date" value={filters.date} onChange={(e) => setFilters({...filters,date:e.target.value,from:'',to:''})} style={{ padding:'0.5rem 0.75rem', width:170 }} /></div>
        <div><label style={LS}>From</label>
          <input type="date" value={filters.from} onChange={(e) => setFilters({...filters,from:e.target.value,date:''})} style={{ padding:'0.5rem 0.75rem', width:170 }} /></div>
        <div><label style={LS}>To</label>
          <input type="date" value={filters.to}   onChange={(e) => setFilters({...filters,to:e.target.value,date:''})}   style={{ padding:'0.5rem 0.75rem', width:170 }} /></div>
        <Button variant="secondary" size="sm" onClick={() => setFilters({date:'',from:'',to:''})}>Clear</Button>
        {classId && <Button variant="success" icon="⬇️" loading={exporting} onClick={handleExport}>Export & Save CSV</Button>}
      </div>

      {/* Export confirmation */}
      {savedBanner && (
        <div style={{ padding:'0.85rem 1.25rem', background:'var(--success-bg)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'1.2rem' }}>✅</span>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:600, color:'var(--success)', fontSize:'0.875rem' }}>
              {savedBanner.count} records exported — CSV downloaded + saved on server
            </p>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>
              Server path: <code style={{ background:'var(--bg-secondary)', padding:'1px 6px', borderRadius:4, fontFamily:'monospace' }}>{savedBanner.savedPath}</code>
            </p>
          </div>
          <button onClick={() => setSavedBanner(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.1rem' }}>✕</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <div style={{ padding:'0.9rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:'0.95rem', fontWeight:700 }}>Attendance Records</h3>
          <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{records.length} records</span>
        </div>
        {!classId
          ? <Empty icon="📋" text="Select a class to view records" />
          : <AttendanceTable records={records} loading={loading} showStudent />}
      </div>
    </div>
  );
};

// ─── TAB 2: Manual Attendance ─────────────────────────────────────────────────
const ManualAttendanceTab = ({ classId, classData }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date,       setDate]       = useState(today);
  const [studentMap, setStudentMap] = useState({}); // id → {status, remarks}
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  // Initialise when class changes
  useEffect(() => {
    if (!classData?.students?.length) { setStudentMap({}); return; }
    const init = {};
    classData.students.forEach((s) => { init[s._id] = { status:'present', remarks:'' }; });
    setStudentMap(init);
    setSaved(false);
  }, [classData]);

  const setField = (id, field, val) =>
    setStudentMap((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const setAll = (status) => {
    const m = {};
    (classData?.students || []).forEach((s) => { m[s._id] = { status, remarks: studentMap[s._id]?.remarks || '' }; });
    setStudentMap(m);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!classId) { toast.error('Select a class first'); return; }
    const entries = Object.entries(studentMap);
    if (!entries.length) { toast.error('No students in this class'); return; }
    try {
      setSaving(true);
      const students = entries.map(([studentId, { status, remarks }]) => ({ studentId, status, remarks }));
      const res = await attendanceService.markManual({ students, classId, date });
      toast.success(`Saved ${res.data.results.marked.length} attendance records`);
      setSaved(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const students     = classData?.students || [];
  const presentCount = Object.values(studentMap).filter((s) => s?.status === 'present').length;
  const absentCount  = Object.values(studentMap).filter((s) => s?.status === 'absent').length;
  const lateCount    = Object.values(studentMap).filter((s) => s?.status === 'late').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Controls */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.1rem 1.25rem', display:'flex', gap:'1rem', alignItems:'flex-end', flexWrap:'wrap' }}>
        <div><label style={LS}>Attendance Date</label>
          <input type="date" value={date} max={today} onChange={(e) => { setDate(e.target.value); setSaved(false); }} style={{ padding:'0.5rem 0.75rem', width:180 }} /></div>
        {students.length > 0 && (
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <button onClick={() => setAll('present')} style={{ ...QB, background:'var(--success-bg)', color:'var(--success)', border:'1px solid rgba(16,185,129,0.3)' }}>✅ All Present</button>
            <button onClick={() => setAll('absent')}  style={{ ...QB, background:'var(--danger-bg)',  color:'var(--danger)',  border:'1px solid rgba(239,68,68,0.3)' }}>❌ All Absent</button>
            <button onClick={() => setAll('late')}    style={{ ...QB, background:'var(--warning-bg)', color:'var(--warning)', border:'1px solid rgba(245,158,11,0.3)' }}>⏰ All Late</button>
          </div>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          {students.length > 0 && (
            <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
              ✅{presentCount} · ❌{absentCount} · ⏰{lateCount}
            </span>
          )}
          <Button variant="primary" loading={saving} onClick={handleSave} disabled={!classId||students.length===0}>
            💾 Save Attendance
          </Button>
        </div>
      </div>

      {saved && (
        <div style={{ padding:'0.75rem 1.25rem', background:'var(--success-bg)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'var(--radius)', color:'var(--success)', fontWeight:600, fontSize:'0.875rem' }}>
          ✅ Attendance saved for {format(new Date(date + 'T12:00:00'), 'dd MMM yyyy')}
        </div>
      )}

      {/* Per-student rows */}
      {!classId ? <Empty icon="✍️" text="Select a class to mark attendance" /> :
       students.length === 0 ? <Empty icon="👥" text="No students enrolled yet" /> : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
          <div style={{ padding:'0.9rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:700 }}>Mark Each Student</h3>
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{students.length} students</span>
          </div>
          {students.map((student, idx) => {
            const entry  = studentMap[student._id] || { status:'present', remarks:'' };
            const status = entry.status;
            const rowBg  = status==='absent'?'rgba(239,68,68,0.04)':status==='late'?'rgba(245,158,11,0.04)':'transparent';
            return (
              <div key={student._id} style={{ borderBottom: idx<students.length-1?'1px solid var(--border)':'none', background:rowBg }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.85rem 1.25rem' }}>
                  {/* Avatar */}
                  <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:'var(--accent-glow)', color:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem' }}>
                    {student.userId?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{student.userId?.name||'Unknown'}</p>
                    <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{student.rollNumber}</p>
                  </div>
                  {/* Status buttons */}
                  <div style={{ display:'flex', gap:'0.35rem', flexShrink:0 }}>
                    {[
                      { val:'present', label:'✅ Present', on:'#10b981', onBg:'rgba(16,185,129,0.15)' },
                      { val:'absent',  label:'❌ Absent',  on:'#ef4444', onBg:'rgba(239,68,68,0.15)' },
                      { val:'late',    label:'⏰ Late',    on:'#f59e0b', onBg:'rgba(245,158,11,0.15)' },
                    ].map(({ val, label, on, onBg }) => (
                      <button key={val} onClick={() => { setField(student._id, 'status', val); setSaved(false); }} style={{
                        padding:'4px 10px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-body)',
                        fontSize:'0.75rem', fontWeight:600, transition:'all 0.15s',
                        background: status===val ? onBg : 'var(--bg-secondary)',
                        color: status===val ? on : 'var(--text-muted)',
                        border: `1px solid ${status===val ? on+'55' : 'var(--border)'}`,
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
                {/* Remarks input */}
                <div style={{ padding:'0 1.25rem 0.75rem 1.25rem', paddingLeft: '3.8rem' }}>
                  <input
                    type="text" placeholder="Remarks (optional)..."
                    value={entry.remarks}
                    onChange={(e) => { setField(student._id, 'remarks', e.target.value); setSaved(false); }}
                    style={{ padding:'0.35rem 0.7rem', fontSize:'0.78rem', width:'100%', maxWidth:480 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── TAB 3: Student List ──────────────────────────────────────────────────────
const StudentListTab = ({ classId, classData }) => {
  const students  = classData?.students || [];
  const faceCount = students.filter((s) => s.faceRegistered).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {!classId ? <Empty icon="👥" text="Select a class to view enrolled students" /> :
       students.length === 0 ? (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'3rem', textAlign:'center' }}>
          <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>👥</p>
          <p style={{ color:'var(--text-muted)' }}>No students enrolled yet.</p>
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>
            Share code <strong style={{ color:'var(--accent-light)' }}>{classData?.joinCode}</strong> with students.
          </p>
        </div>
      ) : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
          <div style={{ padding:'0.9rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:700 }}>Enrolled Students</h3>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <Pill bg="var(--accent-glow)" color="var(--accent-light)">{students.length} enrolled</Pill>
              <Pill bg="var(--success-bg)"  color="var(--success)">{faceCount} face registered</Pill>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['#','Student','Roll No.','Department','Semester','Face Status','Enrolled On'].map((h) => (
                    <th key={h} style={{ padding:'0.6rem 1rem', textAlign:'left', fontWeight:600, fontSize:'0.71rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background='var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background='transparent'}>
                    <td style={tdS}><span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{i+1}</span></td>
                    <td style={tdS}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:'var(--accent-glow)', color:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', flexShrink:0 }}>
                          {s.userId?.name?.[0]?.toUpperCase()||'?'}
                        </div>
                        <div>
                          <p style={{ fontWeight:600 }}>{s.userId?.name||'—'}</p>
                          <p style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>{s.userId?.email||''}</p>
                        </div>
                      </div>
                    </td>
                    <td style={tdS}><code style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{s.rollNumber}</code></td>
                    <td style={tdS}>{s.department}</td>
                    <td style={tdS}><Pill bg="var(--accent-glow)" color="var(--accent-light)">Sem {s.semester}</Pill></td>
                    <td style={tdS}>
                      {s.faceRegistered
                        ? <Pill bg="var(--success-bg)" color="var(--success)">✓ Registered</Pill>
                        : <Pill bg="var(--warning-bg)" color="var(--warning)">⚠ Not set</Pill>}
                    </td>
                    <td style={tdS}><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{new Date(s.createdAt||Date.now()).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const Empty = ({ icon, text }) => (
  <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>
    <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>{icon}</p>
    <p>{text}</p>
  </div>
);

const Pill = ({ children, bg, color }) => (
  <span style={{ padding:'2px 10px', borderRadius:999, background:bg, color, fontSize:'0.72rem', fontWeight:600 }}>{children}</span>
);

const LS  = { fontSize:'0.78rem', color:'var(--text-muted)', display:'block', marginBottom:'0.3rem', fontWeight:600 };
const tdS = { padding:'0.75rem 1rem', verticalAlign:'middle' };
const QB  = { padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'0.8rem' };

export default TeacherAttendance;
