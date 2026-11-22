import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';

const LoginPage = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (error) { toast.error(error); clearError(); } }, [error, clearError]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="animated-bg" style={{
      display: 'flex', minHeight: '100vh'
    }}>
      {/* Left panel – branding */}
      <div style={{
        flex: 1, display: 'none',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '3rem', gap: '2rem',
        backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 30, 0.4)',
        '@media(minWidth:768px)': { display: 'flex' },
      }}
        className="left-panel fade-in-up delay-1"
      >
        {/* Hide on small screens via CSS */}
        <div style={{ textAlign: 'center' }}>
          <div className="float-anim" style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', margin: '0 auto 1.5rem',
            boxShadow: '0 10px 30px rgba(59,130,246,0.5)',
          }}>🎓</div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            AttendEase
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>
            AI-powered face recognition attendance system for modern educational institutions.
          </p>
        </div>

        <div className="fade-in-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 280 }}>
          {[
            { icon: '🤖', text: 'Automatic face recognition' },
            { icon: '📊', text: 'Real-time attendance analytics' },
            { icon: '🔐', text: 'Role-based access control' },
            { icon: '📱', text: 'Works on any device' },
          ].map(({ icon, text }, idx) => (
            <div key={text} className={`fade-in-up delay-${idx + 2} hover-lift`} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.3s ease'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '2rem',
      }}>
        <div className="glass-panel fade-in-up delay-2" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="float-anim" style={{ fontSize: '2.5rem', display: 'inline-block' }}>🎓</span>
            <h2 className="text-gradient" style={{ marginTop: '0.5rem', fontSize: '1.8rem' }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <FormField
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              icon="📧"
            />

            <FormField
              label="Password"
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              icon="🔒"
            />
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none',
            }}>
              <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} style={{ width: 'auto' }} />
              Show password
            </label>

            <Button type="submit" fullWidth loading={isLoading} size="lg" style={{ marginTop: '0.5rem' }}>
              Sign In
            </Button>
          </form>

          <p className="fade-in-up delay-4" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="fade-in-up delay-5" style={{
            marginTop: '2rem', padding: '1rem',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius)', fontSize: '0.78rem',
          }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Demo Credentials
            </p>
            {[
              { role: 'Admin',   email: 'admin@demo.com',   pass: 'admin123' },
              { role: 'Teacher', email: 'teacher@demo.com', pass: 'teacher123' },
              { role: 'Student', email: 'student@demo.com', pass: 'student123' },
            ].map(({ role, email, pass }) => (
              <div key={role} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.3rem 0', borderBottom: '1px solid var(--border)',
                gap: '0.5rem',
              }}>
                <span style={{ color: 'var(--text-muted)', width: 56 }}>{role}</span>
                <button
                  onClick={() => setForm({ email, password: pass })}
                  style={{
                    background: 'var(--accent-glow)', color: 'var(--accent-light)',
                    border: 'none', borderRadius: 4, padding: '2px 8px',
                    fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'monospace',
                  }}
                >
                  {email}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .left-panel { display: flex !important; } }
      `}</style>
    </div>
  );
};

export default LoginPage;
