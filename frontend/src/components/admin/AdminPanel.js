import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api.service';
import Button from '../shared/Button';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:   { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  teacher: { bg: 'var(--success-bg)', color: 'var(--success)' },
  student: { bg: 'var(--accent-glow)', color: 'var(--accent-light)' },
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [actionId, setActionId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search)     params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userService.getAll(params);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]); // eslint-disable-line

  const handleToggle = async (id) => {
    try {
      setActionId(id);
      const res = await userService.toggleStatus(id);
      toast.success(res.data.message);
      fetchUsers();
    } catch { toast.error('Failed to update status'); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This is permanent.`)) return;
    try {
      setActionId(id);
      await userService.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
    finally { setActionId(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem',
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
      }}>
        <input
          type="text" placeholder="🔍 Search users..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: '1 1 200px', padding: '0.55rem 0.8rem', maxWidth: 300 }}
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: '0.55rem 0.8rem', width: 150 }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}>
          Clear
        </Button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {pagination.total || 0} users total
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '0.65rem 1rem', textAlign: 'left',
                      fontWeight: 600, fontSize: '0.72rem',
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const rc = ROLE_COLORS[u.role] || ROLE_COLORS.student;
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: rc.bg, color: rc.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                          }}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                          background: rc.bg, color: rc.color, textTransform: 'capitalize',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                          background: u.isActive ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: u.isActive ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Button
                            variant={u.isActive ? 'warning' : 'success'}
                            size="sm"
                            loading={actionId === u._id}
                            onClick={() => handleToggle(u._id)}
                            style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="danger" size="sm"
                            loading={actionId === u._id}
                            onClick={() => handleDelete(u._id, u.name)}
                            style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 15 && (
          <div style={{
            padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
            display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center',
          }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</Button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
              {page} / {Math.ceil(pagination.total / 15)}
            </span>
            <Button variant="secondary" size="sm"
              disabled={page >= Math.ceil(pagination.total / 15)}
              onClick={() => setPage(page + 1)}>
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
