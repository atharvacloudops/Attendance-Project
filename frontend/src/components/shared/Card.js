import React from 'react';

const Card = ({ children, title, subtitle, action, style = {}, padding = '1.5rem', className = '' }) => (
  <div
    className={className}
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      ...style,
    }}
  >
    {(title || action) && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          {title && (
            <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div style={{ padding }}>{children}</div>
  </div>
);

export const StatCard = ({ icon, label, value, color = 'var(--accent)', trend }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'border-color 0.2s',
  }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <div style={{
      width: 48, height: 48,
      borderRadius: 12,
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.4rem', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-display)', color, lineHeight: 1.2, marginTop: 2 }}>
        {value}
      </p>
      {trend && (
        <p style={{ fontSize: '0.75rem', color: trend > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </p>
      )}
    </div>
  </div>
);

export default Card;
