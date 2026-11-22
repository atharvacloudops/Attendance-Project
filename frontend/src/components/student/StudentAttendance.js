import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api.service';
import AttendanceTable from '../shared/AttendanceTable';
import Button from '../shared/Button';
import toast from 'react-hot-toast';

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filters.from) params.from = filters.from;
      if (filters.to)   params.to   = filters.to;
      const res = await attendanceService.getMy(params);
      setRecords(res.data.records);
      setStats(res.data.stats);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filters]); // eslint-disable-line

  const pct = stats.percentage || 0;
  const pctColor = pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total', value: stats.total || 0, color: 'var(--info)' },
          { label: 'Present', value: stats.present || 0, color: 'var(--success)' },
          { label: 'Absent', value: (stats.total || 0) - (stats.present || 0), color: 'var(--danger)' },
          { label: 'Percentage', value: `${pct}%`, color: pctColor },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1.1rem', textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {label}
            </p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', marginTop: 4 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem',
        display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
            From Date
          </label>
          <input type="date" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            style={{ padding: '0.5rem 0.75rem', width: 160 }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
            To Date
          </label>
          <input type="date" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            style={{ padding: '0.5rem 0.75rem', width: 160 }}
          />
        </div>
        <Button variant="secondary" onClick={() => { setFilters({ from: '', to: '' }); setPage(1); }}>
          Clear
        </Button>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Attendance History</h3>
        </div>
        <AttendanceTable records={records} loading={loading} />

        {/* Pagination */}
        {pagination.total > (pagination.limit || 20) && (
          <div style={{
            padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
            display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center',
          }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</Button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
              Page {page} of {Math.ceil(pagination.total / (pagination.limit || 20))}
            </span>
            <Button variant="secondary" size="sm"
              disabled={page >= Math.ceil(pagination.total / (pagination.limit || 20))}
              onClick={() => setPage(page + 1)}>
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
