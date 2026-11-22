import React from 'react';

const variants = {
  primary: {
    background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-hover) 100%)',
    color: '#fff',
    border: 'none',
    hoverBg: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
    boxShadow: '0 4px 15px var(--accent-glow)',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-light)',
    hoverBg: 'rgba(255, 255, 255, 0.1)',
    boxShadow: 'none',
  },
  danger: {
    background: 'var(--danger-bg)',
    color: '#fff',
    border: '1px solid rgba(239,68,68,0.4)',
    hoverBg: 'rgba(239,68,68,0.3)',
    boxShadow: '0 4px 15px rgba(239,68,68,0.2)',
  },
  success: {
    background: 'var(--success-bg)',
    color: '#fff',
    border: '1px solid rgba(16,185,129,0.4)',
    hoverBg: 'rgba(16,185,129,0.3)',
    boxShadow: '0 4px 15px rgba(16,185,129,0.2)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    hoverBg: 'rgba(255,255,255,0.05)',
    boxShadow: 'none',
  },
};

const sizes = {
  sm: { padding: '0.35rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' },
  md: { padding: '0.55rem 1.2rem', fontSize: '0.875rem', borderRadius: '8px' },
  lg: { padding: '0.75rem 1.6rem', fontSize: '1rem', borderRadius: '10px' },
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  onClick,
  type = 'button',
  style = {},
  ...rest
}) => {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        letterSpacing: '0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.18s ease',
        width: fullWidth ? '100%' : undefined,
        background: v.background,
        color: v.color,
        border: v.border,
        boxShadow: v.boxShadow,
        position: 'relative',
        overflow: 'hidden',
        ...s,
        ...style,
      }}
      className="hover-lift"
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = v.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = v.background;
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 14, height: 14,
            border: '2px solid transparent',
            borderTopColor: 'currentColor',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }} />
          Loading...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
};

export default Button;
