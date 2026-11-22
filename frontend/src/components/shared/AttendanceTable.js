import React from 'react';
import { format } from 'date-fns';

const STATUS_STYLES = {
  present: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Present' },
  absent:  { bg: 'var(--danger-bg)',  color: 'var(--danger)',  label: 'Absent' },
  late:    { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Late' },
};

const METHOD_ICONS = {
  face_recognition: '🤖',
  manual: '✍️',
  qr_code: '📱',
};

const AttendanceTable = ({ records = [], showStudent = false, loading = false }) => {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading records...</p>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div style={{
        padding: '3rem 2rem', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '2.5rem', opacity: 0.4 }}>📭</span>
        <p style={{ color: 'var(--text-muted)' }}>No attendance records found</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '0.875rem',
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {showStudent && (
              <>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Roll No.</th>
              </>
            )}
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Method</th>
            <th style={thStyle}>Confidence</th>
            <th style={thStyle}>Class</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => {
            const s = STATUS_STYLES[rec.status] || STATUS_STYLES.absent;
            return (
              <tr
                key={rec._id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {showStudent && (
                  <>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'var(--accent-glow)', color: 'var(--accent-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.8rem',
                        }}>
                          {rec.studentId?.userId?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        {rec.studentId?.userId?.name || '—'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {rec.studentId?.rollNumber || '—'}
                      </span>
                    </td>
                  </>
                )}
                <td style={tdStyle}>
                  {rec.dateString
                    ? format(new Date(rec.dateString), 'dd MMM yyyy')
                    : '—'}
                </td>
                <td style={tdStyle}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px',
                    borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: s.bg, color: s.color,
                  }}>
                    {s.label}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span title={rec.method}>
                    {METHOD_ICONS[rec.method] || '—'}
                    {' '}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {rec.method?.replace('_', ' ')}
                    </span>
                  </span>
                </td>
                <td style={tdStyle}>
                  {rec.confidence != null ? (
                    <span style={{
                      color: rec.confidence >= 0.7 ? 'var(--success)' : 'var(--warning)',
                      fontWeight: 600,
                    }}>
                      {Math.round(rec.confidence * 100)}%
                    </span>
                  ) : '—'}
                </td>
                <td style={tdStyle}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {rec.classId?.name || 'General'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  padding: '0.6rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  color: 'var(--text-primary)',
  verticalAlign: 'middle',
};

export default AttendanceTable;
