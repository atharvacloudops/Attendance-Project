import React, { useEffect, useState } from 'react';
import { timetableService } from '../../services/api.service';

const StudentTimetable = () => {
  const [slots, setSlots] = useState([]);
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableService.getToday()
      .then(res => {
        // Backend: ok(res, { slots, day }) → res.data = { success, message, data: { slots, day } }
        const data = res.data?.data || {};
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setDay(data.day || '');
      })
      .catch(err => {
        console.error(err);
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted" style={{ padding: '20px' }}>Loading timetable...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="fade-in">
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>📅 Today's Timetable {day && <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>— {day}</span>}</h2>

      {slots.length === 0 ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</p>
          <p style={{ color: 'var(--text-secondary)' }}>No classes scheduled for today!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {slots.map((item) => (
            <div key={item._id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '18px 20px' }}>
              <div style={{
                minWidth: 70, textAlign: 'center', padding: '8px',
                background: 'rgba(59,130,246,0.1)', borderRadius: '8px',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontWeight: 700, marginBottom: 2 }}>{item.startTime}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>to {item.endTime}</p>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{item.subject}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>👨‍🏫 {item.teacher?.name || 'N/A'} {item.class?.name && <span>· {item.class.name}</span>}</p>
              </div>
              {item.room && (
                <div className="badge badge-accent">🏫 {item.room}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;