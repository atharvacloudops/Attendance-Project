import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = {
  student: [
    { to: '/dashboard',  icon: '🏠', label: 'Dashboard' },
    { to: '/attendance', icon: '📸', label: 'Classrooms' },
    { to: '/student/classes', icon: '📚', label: 'My Classes' },
    { to: '/student/materials', icon: '📄', label: 'Subjects' },
    { to: '/timetable',  icon: '📅', label: 'Timetable' },
  ],
  teacher: [
    { to: '/dashboard',  icon: '🏠', label: 'Dashboard' },
    { to: '/attendance', icon: '📋', label: 'Classrooms' },
    { to: '/teacher/students', icon: '👥', label: 'All Students' },
    { to: '/teacher/defaulters', icon: '⚠️', label: 'Defaulter Students' },
    { to: '/teacher/absentees', icon: '❌', label: 'Absent Students' },
    { to: '/teacher/materials', icon: '📤', label: 'Study Material' },
    { to: '/timetable',  icon: '📅', label: 'Class Timetable' },
  ],
  admin: [
    { to: '/dashboard',  icon: '🏠', label: 'Dashboard' },
    { to: '/attendance', icon: '📋', label: 'Attendance' },
    { to: '/admin',      icon: '⚙️', label: 'Admin Panel' },
    { to: '/admin/timetable', icon: '🗓', label: 'Timetable Setup' },
  ],
};

const ROLE_COLORS = { student: '#3b82f6', teacher: '#10b981', admin: '#f59e0b' };

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_ITEMS[user?.role] || [];
  const roleColor = ROLE_COLORS[user?.role] || '#3b82f6';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          {!collapsed && <span className={styles.logoText}>AttendEase</span>}
        </div>
        <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User card */}
      {!collapsed && (
        <div className={styles.userCard}>
          <div className={styles.avatar} style={{ background: `${roleColor}22`, color: roleColor }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole} style={{ color: roleColor }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
