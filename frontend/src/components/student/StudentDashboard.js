import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, classService } from '../../services/api.service';
import { StatCard } from '../shared/Card';
import FaceCamera from '../shared/FaceCamera';
import FaceRegister from '../shared/FaceRegister';
import Button from '../shared/Button';
import AttendanceTable from '../shared/AttendanceTable';

const StudentDashboard = () => {
  const { user, studentProfile, updateStudentProfile } = useAuth();

  const [showCamera,   setShowCamera]   = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showJoin,     setShowJoin]     = useState(false);
  const [selectedClass,   setSelectedClass]   = useState('');
  const [myClasses,    setMyClasses]    = useState([]);
  const [attendance,   setAttendance]   = useState({ records: [], stats: {} });
  const [loading,      setLoading]      = useState(true);

  // Fetch attendance history and enrolled classes
  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, classRes] = await Promise.allSettled([
        attendanceService.getMy({ limit: 10 }),
        classService.getMy(),
      ]);
      if (attRes.status === 'fulfilled') setAttendance(attRes.value.data);
      if (classRes.status === 'fulfilled') setMyClasses(classRes.value.data.classes || []);
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // When student clicks "Mark Attendance"
  const handleMarkClick = () => {
    if (myClasses.length > 0) {
      setShowClassPicker(true);
    } else {
      // No class enrolled — mark general attendance
      setSelectedClass('');
      setShowCamera(true);
    }
  };

  const handleClassSelected = () => {
    setShowClassPicker(false);
    setShowCamera(true);
  };

  const handleAttendanceSuccess = () => {
    setShowCamera(false);
    setSelectedClass('');
    fetchData();
  };

  const pct      = attendance.stats?.percentage || 0;
  const pctColor = pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Welcome banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1f3d 0%, #0f2547 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 'var(--radius-xl)', padding: '1.75rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Good {greeting},
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginTop: '0.2rem' }}>
            {user?.name} 👋
          </h2>
          {studentProfile && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {studentProfile.rollNumber} · {studentProfile.department} · Sem {studentProfile.semester}
              {studentProfile.division && ` · Div ${studentProfile.division}`}
            </p>
          )}
        </div>

        {/* CTA — only show when camera/register not open */}
        {!showCamera && !showRegister && !showClassPicker && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {studentProfile?.faceRegistered ? (
              <Button variant="primary" size="lg" icon="📸" onClick={handleMarkClick}
                style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                Mark Attendance
              </Button>
            ) : (
              <Button variant="secondary" size="lg" icon="🔐" onClick={() => setShowRegister(true)}>
                Register Face First
              </Button>
            )}
            <Button variant="primary" size="lg" icon="🔑" onClick={() => setShowJoin(true)}
              style={{ background:'var(--warning)', color:'#000', fontWeight:700 }}>
              Join a Class
            </Button>
          </div>
        )}
      </div>

      {/* ── Join Class Modal ── */}
      {showJoin && (
        <JoinClassModal
          onClose={() => setShowJoin(false)}
          onJoined={() => { setShowJoin(false); fetchData(); }}
        />
      )}
      {/* ── Face registration ── */}
      {showRegister && (
        <FaceRegister
          onSuccess={(profile) => { updateStudentProfile(profile); setShowRegister(false); }}
          onCancel={() => setShowRegister(false)}
        />
      )}

      {/* ── Class picker modal ── */}
      {showClassPicker && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '1.5rem', maxWidth: 500,
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            📚 Select Class for Attendance
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Choose which class you want to mark attendance for today.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {/* "No specific class" option */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: selectedClass === '' ? 'var(--accent-glow)' : 'var(--bg-secondary)',
              border: `1px solid ${selectedClass === '' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <input type="radio" name="cls" value=""
                checked={selectedClass === ''}
                onChange={() => setSelectedClass('')}
                style={{ accentColor: 'var(--accent)', width: 'auto' }}
              />
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>General (No specific class)</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mark attendance without linking to a class</p>
              </div>
            </label>

            {myClasses.map((c) => (
              <label key={c._id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: selectedClass === c._id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                border: `1px solid ${selectedClass === c._id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <input type="radio" name="cls" value={c._id}
                  checked={selectedClass === c._id}
                  onChange={() => setSelectedClass(c._id)}
                  style={{ accentColor: 'var(--accent)', width: 'auto' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {c.subject} · {c.teacher?.name}
                  </p>
                </div>
                <span style={{
                  padding: '2px 10px', borderRadius: 999,
                  background: 'var(--accent-glow)', color: 'var(--accent-light)',
                  fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
                }}>
                  Sem {c.semester}
                </span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowClassPicker(false)}>Cancel</Button>
            <Button variant="primary" icon="📸" onClick={handleClassSelected}>
              Open Camera
            </Button>
          </div>
        </div>
      )}

      {/* ── Face camera ── */}
      {showCamera && (
        <FaceCamera
          classId={selectedClass || undefined}
          onSuccess={handleAttendanceSuccess}
          onCancel={() => { setShowCamera(false); setSelectedClass(''); }}
        />
      )}

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem' }}>
        <StatCard icon="📅" label="Total Classes"  value={attendance.stats?.total   || 0}  color="var(--info)" />
        <StatCard icon="✅" label="Present"         value={attendance.stats?.present || 0}  color="var(--success)" />
        <StatCard icon="📊" label="Attendance %"   value={`${pct}%`}                        color={pctColor} />
        <StatCard
          icon={studentProfile?.faceRegistered ? '🤖' : '⚠️'}
          label="Face ID"
          value={studentProfile?.faceRegistered ? 'Active' : 'Not Set'}
          color={studentProfile?.faceRegistered ? 'var(--success)' : 'var(--warning)'}
        />
      </div>

      {/* ── Attendance % progress bar ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Overall Attendance</span>
          <span style={{ color: pctColor, fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>{pct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${pctColor}cc, ${pctColor})`,
            borderRadius: 999, transition: 'width 1s ease',
          }} />
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {pct >= 75
            ? '✅ Great attendance! Keep it up.'
            : pct >= 60
              ? '⚠️ Attendance between 60–74%. Try to improve.'
              : '🚨 Attendance below 60%. Urgent improvement needed.'}
        </p>
      </div>

      {/* ── Recent attendance ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Attendance</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Last {attendance.records?.length || 0} entries
          </span>
        </div>
        <AttendanceTable records={attendance.records} loading={loading} />
      </div>

    </div>
  );
};

// ── Join Class Modal ──────────────────────────────────────────────────────────
const JoinClassModal = ({ onClose, onJoined }) => {
  const [code,    setCode]    = useState('');
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState('');

  const handleJoin = async () => {
    if (code.trim().length !== 6) {
      setError('Join code must be exactly 6 characters');
      return;
    }
    try {
      setJoining(true);
      setError('');
      const res = await classService.join({ joinCode: code.trim().toUpperCase() });
      alert('Joined "' + res.data.class.name + '" successfully!');
      onJoined();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid join code. Ask your teacher for the correct code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '2rem',
        width: '100%', maxWidth: 420,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔑 Join a Class</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Enter the 6-letter code from your teacher
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-muted)',
            fontSize: '1.2rem', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* How-to tip */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '0.85rem', marginBottom: '1.25rem',
          fontSize: '0.8rem', color: 'var(--text-secondary)',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            📋 Where to get the code:
          </p>
          <p>Ask your teacher. They see it on their class card — it looks like <strong style={{ color: 'var(--warning)', fontFamily: 'monospace' }}>9R4B5J</strong></p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            fontSize: '0.82rem', fontWeight: 600,
            color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem',
          }}>
            Class Join Code *
          </label>
          <input
            type="text"
            value={code}
            maxLength={6}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="e.g.  9 R 4 B 5 J"
            style={{
              padding: '0.85rem 1rem',
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '0.3em',
              textAlign: 'center',
              textTransform: 'uppercase',
              border: `2px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              width: '100%',
            }}
          />
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
              ⚠ {error}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={joining}
            onClick={handleJoin}
            disabled={code.length !== 6}
          >
            Join Class →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

