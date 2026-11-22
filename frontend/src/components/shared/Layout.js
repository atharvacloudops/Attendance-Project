import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, title }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
      {title && (
        <header style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <h1 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>{title}</h1>
        </header>
      )}
      <div style={{ padding: '2rem' }} className="fade-in">
        {children}
      </div>
    </main>
  </div>
);

export default Layout;
