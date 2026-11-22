import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/shared/Button';

const NotFoundPage = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', gap: '1.5rem', textAlign: 'center',
    padding: '2rem',
  }}>
    <span style={{ fontSize: '5rem', lineHeight: 1 }}>🔍</span>
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--text-muted)' }}>404</h1>
      <h2 style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
        The page you're looking for doesn't exist.
      </p>
    </div>
    <Link to="/dashboard">
      <Button variant="primary">Go to Dashboard</Button>
    </Link>
  </div>
);

export default NotFoundPage;
