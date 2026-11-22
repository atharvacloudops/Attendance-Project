import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';

const DEPT_OPTIONS = [
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Information Technology', label: 'Information Technology' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Civil', label: 'Civil' },
];

const SEM_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1, label: `Semester ${i + 1}`,
}));

const ROLE_OPTIONS = [
  { value: 'student', label: '🎓 Student' },
  { value: 'teacher', label: '👨‍🏫 Teacher' },
];

const RegisterPage = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', rollNumber: '', department: '', semester: '', division: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { if (error) { toast.error(error); clearError(); } }, [error, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name = 'Name is required';
    if (!form.email)          e.email = 'Email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.role === 'student') {
      if (!form.rollNumber.trim()) e.rollNumber = 'Roll number is required';
      if (!form.department)        e.department = 'Department is required';
      if (!form.semester)          e.semester = 'Semester is required';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };
    if (form.role === 'student') {
      payload.rollNumber = form.rollNumber;
      payload.department = form.department;
      payload.semester   = parseInt(form.semester);
      payload.division   = form.division;
    }

    const result = await register(payload);
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="animated-bg" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 540 }} className="fade-in-up delay-1">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="float-anim" style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 1.25rem',
            boxShadow: '0 10px 30px rgba(59,130,246,0.4)',
          }}>🎓</div>
          <h2 className="text-gradient" style={{ fontSize: '2rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
            Join the AttendEase system
          </p>
        </div>

        <div className="glass-panel fade-in-up delay-2" style={{
          padding: '2.5rem',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Role selector */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {ROLE_OPTIONS.map((r) => (
                <label key={r.value} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', padding: '0.6rem',
                  border: `2px solid ${form.role === r.value ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  background: form.role === r.value ? 'var(--accent-glow)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.18s',
                  fontSize: '0.875rem', fontWeight: 600,
                  color: form.role === r.value ? 'var(--accent-light)' : 'var(--text-secondary)',
                }}>
                  <input type="radio" name="role" value={r.value}
                    checked={form.role === r.value} onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  {r.label}
                </label>
              ))}
            </div>

            {/* Common fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FormField label="Full Name" name="name" value={form.name}
                onChange={handleChange} placeholder="John Doe" required error={errors.name} icon="👤" />
              <FormField label="Email" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="you@college.edu" required error={errors.email} icon="📧" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FormField label="Password" name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="Min. 6 characters" required error={errors.password} icon="🔒" />
              <FormField label="Confirm Password" name="confirmPassword" type="password"
                value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password"
                required error={errors.confirmPassword} icon="🔒" />
            </div>

            {/* Student-only fields */}
            {form.role === 'student' && (
              <>
                <div style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '1rem',
                  marginTop: '0.25rem',
                }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    Student Details
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <FormField label="Roll Number" name="rollNumber" value={form.rollNumber}
                      onChange={handleChange} placeholder="e.g. CS2024001" required error={errors.rollNumber} icon="🏷️" />
                    <FormField label="Division" name="division" value={form.division}
                      onChange={handleChange} placeholder="e.g. A" icon="📌" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <FormField label="Department" name="department" value={form.department}
                      onChange={handleChange} options={DEPT_OPTIONS} required error={errors.department} />
                    <FormField label="Semester" name="semester" value={form.semester}
                      onChange={handleChange} options={SEM_OPTIONS} required error={errors.semester} />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" fullWidth loading={isLoading} size="lg" style={{ marginTop: '1rem' }} className="hover-lift">
              Create Account
            </Button>
          </form>
        </div>

        <p className="fade-in-up delay-3" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
