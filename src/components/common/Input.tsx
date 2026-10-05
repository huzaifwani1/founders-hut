import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  helperText,
  style,
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {icon}
          </div>
        )}
        <input
          style={{
            width: '100%',
            padding: icon ? '10px 14px 10px 38px' : '10px 14px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: error ? '1px solid #EF4444' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
            ...style
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = 'var(--border-focus)';
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = 'var(--border-subtle)';
          }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{error}</span>}
      {helperText && !error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{helperText}</span>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        style={{
          width: '100%',
          padding: '10px 14px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: error ? '1px solid #EF4444' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          outline: 'none',
          minHeight: '90px',
          resize: 'vertical',
          transition: 'border-color var(--transition-fast)',
          ...style
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = 'var(--border-focus)';
        }}
        onBlur={(e) => {
          if (!error) e.target.style.borderColor = 'var(--border-subtle)';
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{error}</span>}
    </div>
  );
};
