import React, { useState, useEffect, useCallback } from 'react';
import { timetableService } from '../../services/api.service';
import Button from '../shared/Button';
import toast from 'react-hot-toast';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

// ── Small helper: time label e.g. "09:00" → "9:00 AM" ────────────────────────
const fmt = (t) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12    = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${suffix}`;
};

// ── Colour per day (just visual variety) ─────────────────────────────────────
const DAY_COLORS = {
  Monday:    '#3b82f6',
  Tuesday:   '#8b5cf6',
  Wednesday: '#10b981',
  Thursday:  '#f59e0b',
  Friday:    '#ef4444',
  Saturday:  '#06b6d4',
};

// ─────────────────────────────────────────────────────────────────────────────
const TimetableManager = ({ teachers = [], classes = [] }) => {
  const [grouped,  setGrouped]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);   // slot being edited

  const [form, setForm] = useState({
    subject: '', teacher: '', class: '',
    day: 'Monday', startTime: '09:00', endTime: '10:00', room: '',
  });

  // ── Fetch week data ─────────────────────────────────────────────────────────
  const fetchWeek = useCallback(async () => {
    try {
      setLoading(true);
      const res = await timetableService.getWeek();
      setGrouped(res.data.data.grouped || {});
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  // ── Open form for a new slot pre-filled with day ────────────────────────────
  const openNew = (day) => {
    setEditing(null);
    setForm({ subject:'', teacher:'', class:'', day, startTime:'09:00', endTime:'10:00', room:'' });
    setShowForm(true);
  };

  // ── Open form to edit existing slot ────────────────────────────────────────
  const openEdit = (slot) => {
    setEditing(slot._id);
    setForm({
      subject:   slot.subject,
      teacher:   slot.teacher?._id || slot.teacher,
      class:     slot.class?._id   || slot.class,
      day:       slot.day,
      startTime: slot.startTime,
      endTime:   slot.endTime,
      room:      slot.room || '',
    });
    setShowForm(true);
  };

  // ── Submit: create or update ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.subject || !form.teacher || !form.class) {
      toast.error('Subject, teacher, and class are required');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    try {
      if (editing) {
        await timetableService.update(editing, form);
        toast.success('Slot updated');
      } else {
        await timetableService.create(form);
        toast.success('Slot created');
      }
      setShowForm(false);
      fetchWeek();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving slot');
    }
  };

  // ── Delete a slot ───────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await timetableService.remove(id);
      toast.success('Slot deleted');
      fetchWeek();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', margin:0 }}>
            Timetable Manager
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', margin:'0.25rem 0 0' }}>
            Assign subjects, teachers and time slots for each day of the week
          </p>
        </div>
        <Button variant="primary" icon="+" onClick={() => openNew('Monday')}>
          Add Slot
        </Button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          Loading timetable...
        </div>
      )}

      {/* ── Weekly grid ── */}
      {!loading && DAYS.map(day => (
        <div key={day} style={{
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-lg)', overflow:'hidden',
        }}>
          {/* Day header */}
          <div style={{
            padding:'0.75rem 1.25rem',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <div style={{
                width:12, height:12, borderRadius:'50%',
                background: DAY_COLORS[day],
              }} />
              <span style={{ fontWeight:700, fontSize:'0.95rem' }}>{day}</span>
              <span style={{
                background:'var(--bg-secondary)', color:'var(--text-muted)',
                fontSize:'0.72rem', fontWeight:600, padding:'2px 8px',
                borderRadius:999,
              }}>
                {(grouped[day] || []).length} class{(grouped[day] || []).length !== 1 ? 'es' : ''}
              </span>
            </div>
            <button
              onClick={() => openNew(day)}
              style={{
                background:'transparent', border:`1px dashed ${DAY_COLORS[day]}`,
                color: DAY_COLORS[day], borderRadius:'var(--radius)',
                padding:'4px 12px', fontSize:'0.78rem', fontWeight:600,
                cursor:'pointer',
              }}
            >
              + Add
            </button>
          </div>

          {/* Slots for this day */}
          <div style={{ padding:'0.75rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {(grouped[day] || []).length === 0 ? (
              <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', padding:'0.5rem 0' }}>
                No classes scheduled. Click "+ Add" to add one.
              </p>
            ) : (
              (grouped[day] || []).map(slot => (
                <div key={slot._id} style={{
                  display:'flex', alignItems:'center', gap:'1rem',
                  padding:'0.75rem 1rem',
                  background:'var(--bg-secondary)',
                  border:'1px solid var(--border)',
                  borderLeft:`4px solid ${DAY_COLORS[day]}`,
                  borderRadius:'var(--radius)',
                  flexWrap:'wrap',
                }}>
                  {/* Time */}
                  <div style={{
                    fontFamily:'var(--font-mono)', fontSize:'0.82rem',
                    color:'var(--text-secondary)', minWidth:130, fontWeight:600,
                  }}>
                    {fmt(slot.startTime)} – {fmt(slot.endTime)}
                  </div>

                  {/* Subject */}
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:700, fontSize:'0.9rem', margin:0 }}>
                      {slot.subject}
                    </p>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', margin:'2px 0 0' }}>
                      {slot.teacher?.name || '—'}
                      {slot.class?.name ? ` · ${slot.class.name}` : ''}
                      {slot.room ? ` · Room ${slot.room}` : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button
                      onClick={() => openEdit(slot)}
                      style={{
                        background:'var(--accent-glow)', color:'var(--accent-light)',
                        border:'1px solid var(--accent)', borderRadius:'var(--radius)',
                        padding:'4px 12px', fontSize:'0.78rem', cursor:'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(slot._id)}
                      style={{
                        background:'rgba(239,68,68,0.08)', color:'var(--danger)',
                        border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius)',
                        padding:'4px 12px', fontSize:'0.78rem', cursor:'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* ── Add / Edit modal ── */}
      {showForm && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          style={{
            position:'fixed', inset:0, zIndex:1000,
            background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
          }}
        >
          <div style={{
            background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-xl)', padding:'1.75rem',
            width:'100%', maxWidth:480,
          }}>
            {/* Modal header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, fontSize:'1.05rem', fontWeight:700 }}>
                {editing ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'1.2rem', cursor:'pointer' }}
              >✕</button>
            </div>

            {/* Form fields */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* Subject */}
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:'0.4rem' }}>
                  Subject *
                </label>
                <input
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Data Structures, Physics"
                  style={{ width:'100%', padding:'0.7rem 0.9rem', fontSize:'0.9rem' }}
                />
              </div>

              {/* Teacher dropdown */}
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:'0.4rem' }}>
                  Teacher *
                </label>
                <select
                  value={form.teacher}
                  onChange={e => setForm(p => ({ ...p, teacher: e.target.value }))}
                  style={{ width:'100%', padding:'0.7rem 0.9rem', fontSize:'0.9rem' }}
                >
                  <option value="">-- Select teacher --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Class dropdown */}
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:'0.4rem' }}>
                  Class *
                </label>
                <select
                  value={form.class}
                  onChange={e => setForm(p => ({ ...p, class: e.target.value }))}
                  style={{ width:'100%', padding:'0.7rem 0.9rem', fontSize:'0.9rem' }}
                >
                  <option value="">-- Select class --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name} — {c.subject}</option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:'0.4rem' }}>
                  Day *
                </label>
                <select
                  value={form.day}
                  onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                  style={{ width:'100%', padding:'0.7rem 0.9rem', fontSize:'0.9rem' }}
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Start and End time side by side */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div>
                  <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:'0.4rem' }}>
                    Start time *
                  </label>
                  <select
                    value={form.startTime}
                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                    style={{ width:'100%', padding:'0.7rem 0.9rem', fontSize:'0.9rem' }}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:'0.4rem' }}>
                    End time *
                  </label>
                  <select
                    value={form.endTime}
                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                    style={{ width:'100%', padding:'0.7rem 0.9rem', fontSize:'0.9rem' }}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
                  </select>
                </div>
              </div>

              {/* Room (optional) */}
              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:'0.4rem' }}>
                  Room (optional)
                </label>
                <input
                  value={form.room}
                  onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                  placeholder="e.g. 101, Lab 3"
                  style={{ width:'100%', padding:'0.7rem 0.9rem', fontSize:'0.9rem' }}
                />
              </div>
            </div>

            {/* Modal buttons */}
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'1.5rem' }}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary"   onClick={handleSubmit}>
                {editing ? 'Save Changes' : 'Create Slot'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManager;