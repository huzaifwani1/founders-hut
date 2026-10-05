import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  padding = 'md',
  hoverable = false,
  style,
  onClick
}) => {
  const paddingStyles = {
    none: '0',
    sm: '1rem',
    md: '1.25rem',
    lg: '1.75rem'
  }[padding];

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-fast)',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: hoverable ? 'var(--shadow-sm)' : 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = 'var(--border-medium)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      {(title || action) && (
        <div
          style={{
            padding: padding === 'none' ? '1rem 1.25rem' : paddingStyles,
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: (title || action) && padding !== 'none' ? paddingStyles : paddingStyles }}>
        {children}
      </div>
    </div>
  );
};
