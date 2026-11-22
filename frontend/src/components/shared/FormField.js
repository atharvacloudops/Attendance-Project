import React from 'react';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required,
  disabled,
  options,       // for <select>
  rows,          // for <textarea>
  hint,
  icon,
  style = {},
}) => {
  const inputStyle = {
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    padding: icon ? '0.6rem 0.9rem 0.6rem 2.5rem' : '0.6rem 0.9rem',
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const renderInput = () => {
    if (options) {
      return (
        <select name={name} value={value} onChange={onChange} disabled={disabled} style={inputStyle}>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    if (rows) {
      return (
        <textarea
          name={name} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled} rows={rows}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      );
    }
    return (
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required} disabled={disabled}
        style={inputStyle}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', ...style }}>
      {label && (
        <label style={{
          fontSize: '0.82rem', fontWeight: 600,
          color: 'var(--text-secondary)', letterSpacing: '0.02em',
        }}>
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none',
          }}>
            {icon}
          </span>
        )}
        {renderInput()}
      </div>
      {error && (
        <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>⚠ {error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hint}</span>
      )}
    </div>
  );
};

export default FormField;
