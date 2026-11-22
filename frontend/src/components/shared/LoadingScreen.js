import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => (
  <div style={{
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', gap: '1.5rem', zIndex: 9999,
  }}>
    {/* Logo mark */}
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.6rem', boxShadow: '0 0 30px rgba(59,130,246,0.4)',
    }}>
      🎓
    </div>

    {/* Spinner */}
    <div style={{
      width: 40, height: 40,
      border: '3px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />

    <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
      {message}
    </p>

    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingScreen;
