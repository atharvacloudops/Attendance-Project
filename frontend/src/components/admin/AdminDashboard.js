import React, { useState, useEffect } from 'react';
import { userService, studentService, attendanceService, classService } from '../../services/api.service';
import { StatCard } from '../shared/Card';
import AttendanceTable from '../shared/AttendanceTable';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, students: 0, classes: 0, attendance: 0 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, studentsRes, classesRes, attRes] = await Promise.allSettled([
          userService.getAll({ limit: 1 }),
          studentService.getAll(),
          classService.getAll(),
          attendanceService.getAll({ limit: 10 }),
        ]);

        setStats({
          users:      usersRes.value?.data?.pagination?.total     || 0,
          students:   studentsRes.value?.data?.students?.length   || 0,
          classes:    classesRes.value?.data?.classes?.length     || 0,
          attendance: attRes.value?.data?.pagination?.total       || 0,
        });
        setRecentAttendance(attRes.value?.data?.records || []);
      } catch { toast.error('Failed to load stats'); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg,#2d1b00,#3d2600)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 'var(--radius-xl)', padding: '1.75rem 2rem',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Admin Dashboard
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginTop: '0.2rem' }}>
          System Overview ⚙️
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
          Manage users, monitor attendance, and control system settings.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
        <StatCard icon="👥" label="Total Users"      value={stats.users}      color="var(--accent)" />
        <StatCard icon="🎓" label="Students"         value={stats.students}   color="var(--info)" />
        <StatCard icon="📚" label="Classes"          value={stats.classes}    color="var(--success)" />
        <StatCard icon="✅" label="Attendance Records" value={stats.attendance} color="var(--warning)" />
      </div>

      {/* Recent attendance */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Attendance Activity</h3>
        </div>
        <AttendanceTable records={recentAttendance} loading={loading} showStudent />
      </div>
    </div>
  );
};

export default AdminDashboard;
