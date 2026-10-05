import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled,
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' },
    md: { padding: '9px 18px', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' },
    lg: { padding: '12px 24px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent-gold)',
      color: '#0B0C0E',
      fontWeight: 600,
      border: '1px solid var(--accent-gold-hover)',
      boxShadow: '0 2px 8px rgba(213, 178, 99, 0.2)'
    },
    secondary: {
      backgroundColor: 'var(--bg-surface-elevated)',
      color: 'var(--text-primary)',
      fontWeight: 500,
      border: '1px solid var(--border-medium)'
    },
    subtle: {
      backgroundColor: 'var(--accent-gold-bg)',
      color: 'var(--accent-gold)',
      fontWeight: 600,
      border: '1px solid var(--accent-gold-border)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      fontWeight: 500,
      border: '1px solid transparent'
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#EF4444',
      fontWeight: 500,
      border: '1px solid rgba(239, 68, 68, 0.3)'
    }
  };

  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: fullWidth ? '100%' : 'auto',
        transition: 'all var(--transition-fast)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
      {...props}
    >
      {icon && iconPosition === 'left' && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span style={{ display: 'inline-flex' }}>{icon}</span>}
    </button>
  );
};
