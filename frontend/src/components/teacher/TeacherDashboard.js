/**
 * TeacherDashboard.js
 * ────────────────────
 * Teacher home page with:
 *  • Class cards showing enrolled student count
 *  • "View Students" drawer showing full student list with face-registered status
 *  • "Take Attendance" session — teacher selects students, opens face camera
 *  • Create / Delete class
 */
import React, { useState, useEffect, useCallback } from 'react';
import { classService } from '../../services/api.service';
import { useAuth }      from '../../context/AuthContext';
import { StatCard }     from '../shared/Card';
import Button           from '../shared/Button';
import FaceCamera       from '../shared/FaceCamera';
import toast            from 'react-hot-toast';

// ── Colours ───────────────────────────────────────────────────────────────────
const DEPT_COLOURS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
const deptColor = (dept) => DEPT_COLOURS[Math.abs([...dept].reduce((a,c) => a + c.charCodeAt(0), 0)) % DEPT_COLOURS.length];

// ─────────────────────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes,     setClasses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [form,        setForm]        = useState({ name:'', subject:'', department:'', semester:'', division:'' });
  const [creating,    setCreating]    = useState(false);

  // Drawer state
  const [drawerClass,  setDrawerClass]  = useState(null);  // class object for student list drawer
  // Attendance session
  const [sessionClass, setSessionClass] = useState(null);  // class for take-attendance flow
  const [sessionPhase, setSessionPhase] = useState(null);  // null | 'select' | 'scan'
  const [sessionStudents, setSessionStudents] = useState({}); // studentId → selected bool

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await classService.getAll();
      setClasses(res.data.classes || []);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.department || !form.semester) {
      toast.error('Fill in class name, subject, department, and semester'); return;
    }
    try {
      setCreating(true);
      await classService.create({ ...form, semester: parseInt(form.semester) });
      toast.success('Class created!');
      setShowCreate(false);
      setForm({ name:'', subject:'', department:'', semester:'', division:'' });
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    } finally { setCreating(false); }
  };

  // ── Attendance session: open student-select ────────────────────────────────
  const openSession = async (cls) => {
    try {
      const res = await classService.getById(cls._id);
      const fullClass = res.data.class;
      setSessionClass(fullClass);
      // default: all students selected
      const init = {};
      (fullClass.students || []).forEach((s) => { init[s._id] = true; });
      setSessionStudents(init);
      setSessionPhase('select');
    } catch { toast.error('Failed to load class details'); }
  };

  const startScan = () => {
    const anySelected = Object.values(sessionStudents).some(Boolean);
    if (!anySelected) { toast.error('Select at least one student'); return; }
    setSessionPhase('scan');
  };

  const totalStudents = classes.reduce((a, c) => a + (c.students?.length || 0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ── Banner ── */}
      <div style={{ background:'linear-gradient(135deg,#0d2e1f,#0f3a26)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'var(--radius-xl)', padding:'1.75rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Teacher Dashboard</p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', marginTop:'0.2rem' }}>Welcome, {user?.name} 👨‍🏫</h2>
        </div>
        <Button variant="success" icon="+" onClick={() => setShowCreate(!showCreate)}>
          Create Class
        </Button>
      </div>

      {/* ── Create class form ── */}
      {showCreate && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.5rem' }}>
          <h3 style={{ marginBottom:'1rem', fontWeight:700 }}>New Class</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'0.75rem' }}>
              {[
                { label:'Class Name *', name:'name', placeholder:'e.g. CS-A Morning' },
                { label:'Subject *', name:'subject', placeholder:'e.g. Data Structures' },
                { label:'Department *', name:'department', placeholder:'e.g. Computer Science' },
                { label:'Semester *', name:'semester', placeholder:'1–8', type:'number' },
                { label:'Division', name:'division', placeholder:'e.g. A (optional)' },
              ].map((f) => (
                <div key={f.name}>
                  <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'block', marginBottom:'0.3rem', fontWeight:600 }}>{f.label}</label>
                  <input type={f.type||'text'} value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    placeholder={f.placeholder} style={{ padding:'0.55rem 0.8rem' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop:'1rem', display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>Create</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem' }}>
        <StatCard icon="📚" label="My Classes"     value={classes.length}  color="var(--accent)" />
        <StatCard icon="👥" label="Total Students" value={totalStudents}    color="var(--success)" />
      </div>

      {/* ── Class grid ── */}
      <div>
        <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Your Classes</h3>
        {loading ? (
          <div style={{ textAlign:'center', padding:'2rem' }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', color:'var(--text-muted)' }}>
            <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>📚</p>
            <p>No classes yet. Create your first class above.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:'1rem' }}>
            {classes.map((c) => (
              <ClassCard key={c._id} cls={c}
                onRefresh={fetchClasses}
                onViewStudents={() => setDrawerClass(c)}
                onTakeAttendance={() => openSession(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Student list drawer ── */}
      {drawerClass && (
        <StudentDrawer cls={drawerClass} onClose={() => setDrawerClass(null)} />
      )}

      {/* ── Attendance session: select students ── */}
      {sessionPhase === 'select' && sessionClass && (
        <AttendanceSession
          cls={sessionClass}
          selected={sessionStudents}
          onToggle={(id) => setSessionStudents((prev) => ({ ...prev, [id]: !prev[id] }))}
          onSelectAll={() => { const m={}; sessionClass.students.forEach((s)=>{m[s._id]=true;}); setSessionStudents(m); }}
          onDeselectAll={() => { const m={}; sessionClass.students.forEach((s)=>{m[s._id]=false;}); setSessionStudents(m); }}
          onStart={startScan}
          onClose={() => { setSessionClass(null); setSessionPhase(null); }}
        />
      )}

      {/* ── Attendance session: face scan ── */}
      {sessionPhase === 'scan' && sessionClass && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ width:'100%', maxWidth:700 }}>
            <div style={{ marginBottom:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'white', fontWeight:600 }}>📸 Taking Attendance — {sessionClass.name}</span>
              <Button variant="secondary" size="sm" onClick={() => { setSessionPhase('select'); }}>← Back to list</Button>
            </div>
            <FaceCamera
              classId={sessionClass._id}
              onSuccess={() => { toast.success('Attendance recorded!'); setSessionPhase('select'); }}
              onCancel={() => setSessionPhase('select')}
              onManualFallback={() => setSessionPhase('select')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const ClassCard = ({ cls, onRefresh, onViewStudents, onTakeAttendance }) => {
  const [deleting, setDeleting] = useState(false);
  const color = deptColor(cls.department || '');

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${cls.name}"? This is permanent.`)) return;
    try {
      setDeleting(true);
      await classService.delete(cls._id);
      toast.success('Class deleted'); onRefresh();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const faceCount = (cls.students || []).filter((s) => s.faceRegistered).length;

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', transition:'border-color 0.2s, box-shadow 0.2s', display:'flex', flexDirection:'column', gap:'0.75rem' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor=color; e.currentTarget.style.boxShadow=`0 0 16px ${color}22`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h4 style={{ fontWeight:700, fontFamily:'var(--font-display)', marginBottom:2 }}>{cls.name}</h4>
          <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{cls.subject}</p>
        </div>
        <span style={{ padding:'2px 10px', borderRadius:999, background:`${color}22`, color, fontSize:'0.72rem', fontWeight:700, flexShrink:0, marginLeft:'0.5rem' }}>
          Sem {cls.semester}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:'1rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
        <span>🏢 {cls.department}</span>
        <span>👥 {cls.students?.length || 0} students</span>
        {cls.students?.length > 0 && <span>🤖 {faceCount} registered</span>}
      </div>

      {/* Join code */}
      <div style={{ padding:'0.45rem 0.75rem', background:'var(--bg-secondary)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Join Code</span>
        <span style={{ fontFamily:'monospace', color, fontWeight:700, letterSpacing:'0.12em', fontSize:'0.9rem' }}>{cls.joinCode}</span>
      </div>

      {/* Buttons */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
        <Button variant="secondary" size="sm" onClick={onViewStudents} style={{ flex:1 }}>👥 Students</Button>
        <Button variant="primary"   size="sm" onClick={onTakeAttendance} style={{ flex:1 }}>📸 Take Attendance</Button>
        <Button variant="danger"    size="sm" loading={deleting} onClick={handleDelete}>Delete</Button>
      </div>
    </div>
  );
};

// ── Student Drawer ────────────────────────────────────────────────────────────
const StudentDrawer = ({ cls, onClose }) => {
  const [classData, setClassData] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    classService.getById(cls._id)
      .then((r) => setClassData(r.data.class))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [cls._id]);

  const students = classData?.students || [];
  const faceCount = students.filter((s) => s.faceRegistered).length;

  return (
    <div onClick={(e) => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'flex-end', padding:0 }}>
      <div style={{ width:'min(520px,100vw)', height:'100vh', background:'var(--bg-card)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease' }}>
        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h3 style={{ fontWeight:700 }}>{cls.name} — Students</h3>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>
              {students.length} enrolled · {faceCount} face registered · Join Code: <strong style={{ color:'var(--accent-light)', fontFamily:'monospace' }}>{cls.joinCode}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'1.2rem', cursor:'pointer' }}>✕</button>
        </div>
        
        {/* Add student by join code instruction banner */}
        <div style={{ padding:'0.75rem 1.5rem', background:'rgba(59,130,246,0.08)', borderBottom:'1px solid var(--border)', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
          💡 Students join by entering code <strong style={{ color:'var(--accent-light)', fontFamily:'monospace', letterSpacing:'0.1em' }}>{cls.joinCode}</strong> in their dashboard.
          <button onClick={() => { navigator.clipboard?.writeText(cls.joinCode); alert('Copied: ' + cls.joinCode); }}
            style={{ marginLeft:'0.75rem', background:'var(--accent)', color:'white', border:'none', borderRadius:5, padding:'2px 10px', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
            Copy Code
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:'3rem', textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
          ) : students.length === 0 ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>
              <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>👥</p>
              <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>No students enrolled yet</p>

              {/* Step-by-step instructions */}
              <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'1rem', marginTop:'1rem', textAlign:'left', maxWidth:340 }}>
                <p style={{ fontWeight:700, marginBottom:'0.75rem', color:'var(--text-primary)', fontSize:'0.875rem' }}>
                  How students join this class:
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {[
                    '1. Student logs in to their account',
                    '2. On Dashboard → clicks "Join Class" button',
                    '3. Enters the 6-letter Join Code below',
                    '4. Student appears in this list instantly',
                  ].map((step) => (
                    <p key={step} style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{step}</p>
                  ))}
                </div>
                <div style={{ marginTop:'1rem', padding:'0.6rem 1rem', background:'var(--bg-card)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Join Code to share:</span>
                  <span style={{ fontFamily:'monospace', fontSize:'1.3rem', fontWeight:800, color:'var(--warning)', letterSpacing:'0.15em' }}>{cls.joinCode}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard?.writeText(cls.joinCode); }}
                  style={{ marginTop:'0.6rem', width:'100%', padding:'0.5rem', background:'var(--accent)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'0.82rem' }}
                >
                  📋 Copy Join Code
                </button>
              </div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
              <thead style={{ position:'sticky', top:0, background:'var(--bg-secondary)', zIndex:1 }}>
                <tr>
                  {['#','Name & Email','Roll No.','Face','Enrolled'].map((h) => (
                    <th key={h} style={{ padding:'0.6rem 1rem', textAlign:'left', fontWeight:600, fontSize:'0.71rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid var(--border)' }}>{h}</th>
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
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:'var(--accent-glow)', color:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', flexShrink:0 }}>
                          {s.userId?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight:600 }}>{s.userId?.name || '—'}</p>
                          <p style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>{s.userId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td style={tdS}><code style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{s.rollNumber}</code></td>
                    <td style={tdS}>
                      {s.faceRegistered
                        ? <span style={badge('var(--success-bg)','var(--success)')}>✓ Set</span>
                        : <span style={badge('var(--warning-bg)','var(--warning)')}>⚠ Not set</span>}
                    </td>
                    <td style={tdS}><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{new Date(s.createdAt || Date.now()).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>
    </div>
  );
};

// ── Attendance Session: Student selector ──────────────────────────────────────
const AttendanceSession = ({ cls, selected, onToggle, onSelectAll, onDeselectAll, onStart, onClose }) => {
  const students     = cls.students || [];
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div onClick={(e) => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div className="fade-in" style={{ width:'100%', maxWidth:560, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h3 style={{ fontWeight:700 }}>📸 Take Attendance</h3>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>{cls.name} — {cls.subject}</p>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'1.2rem', cursor:'pointer' }}>✕</button>
        </div>

        {/* Subheader: select-all controls */}
        <div style={{ padding:'0.75rem 1.5rem', borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
          <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', flex:1 }}>{selectedCount} of {students.length} selected</span>
          <button onClick={onSelectAll}   style={{ ...qBtn, background:'var(--success-bg)', color:'var(--success)' }}>All Present</button>
          <button onClick={onDeselectAll} style={{ ...qBtn, background:'var(--danger-bg)',  color:'var(--danger)'  }}>Clear All</button>
        </div>

        {/* Student list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {students.length === 0 ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>
              <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>👥</p>
              <p>No students enrolled in this class.</p>
              <p style={{ fontSize:'0.82rem', marginTop:'0.5rem' }}>Share code <strong style={{ color:'var(--accent-light)' }}>{cls.joinCode}</strong> with students.</p>
            </div>
          ) : students.map((s, i) => {
            const isSelected = selected[s._id] !== false;
            return (
              <div key={s._id} onClick={() => onToggle(s._id)}
                style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.85rem 1.5rem', cursor:'pointer', borderBottom: i<students.length-1 ? '1px solid var(--border)' : 'none', background: isSelected ? 'rgba(59,130,246,0.05)' : 'transparent', transition:'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background=isSelected?'rgba(59,130,246,0.09)':'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background=isSelected?'rgba(59,130,246,0.05)':'transparent'}
              >
                {/* Checkbox */}
                <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${isSelected?'var(--accent)':'var(--border)'}`, background: isSelected?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  {isSelected && <span style={{ color:'white', fontSize:'0.75rem', fontWeight:800 }}>✓</span>}
                </div>
                {/* Avatar */}
                <div style={{ width:38, height:38, borderRadius:10, background: isSelected?'var(--accent-glow)':'var(--bg-secondary)', color: isSelected?'var(--accent-light)':'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0, transition:'all 0.15s' }}>
                  {s.userId?.name?.[0]?.toUpperCase() || '?'}
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:'0.875rem' }}>{s.userId?.name || 'Unknown'}</p>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{s.rollNumber}</p>
                </div>
                {/* Face status */}
                {s.faceRegistered
                  ? <span style={badge('var(--success-bg)','var(--success)')}>🤖 Registered</span>
                  : <span style={badge('var(--warning-bg)','var(--warning)')}>⚠ No face</span>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)', display:'flex', gap:'0.75rem', justifyContent:'flex-end', flexShrink:0 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="📸" onClick={onStart} disabled={selectedCount===0}>
            Start Face Scan ({selectedCount})
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Shared style helpers ──────────────────────────────────────────────────────
const tdS  = { padding:'0.75rem 1rem', verticalAlign:'middle' };
const badge = (bg, color) => ({ padding:'2px 10px', borderRadius:999, background:bg, color, fontSize:'0.72rem', fontWeight:600, whiteSpace:'nowrap' });
const qBtn  = { padding:'4px 12px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:'0.78rem', fontWeight:600, border:'none' };

// ── Add Student Manually by Roll Number ───────────────────────────────────────
// (paste this before the export default line)
export default TeacherDashboard;
