import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showWordmark = true }) => {
  const markDimensions = {
    sm: { box: 28, text: '11px' },
    md: { box: 36, text: '13px' },
    lg: { box: 48, text: '16px' }
  }[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
      {/* Geometric minimal FH emblem */}
      <div
        style={{
          width: `${markDimensions.box}px`,
          height: `${markDimensions.box}px`,
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--accent-gold-border)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-family)',
            fontWeight: 800,
            fontSize: markDimensions.text,
            letterSpacing: '0.08em',
            color: 'var(--accent-gold)',
            lineHeight: 1
          }}
        >
          FH
        </span>
        {/* Subtle geometric inner tick mark */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '4px',
            height: '4px',
            backgroundColor: 'var(--accent-gold)',
            borderRadius: '1px'
          }}
        />
      </div>

      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-family)',
              fontWeight: 700,
              fontSize: size === 'lg' ? '1.25rem' : size === 'sm' ? '0.95rem' : '1.05rem',
              letterSpacing: '0.14em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              lineHeight: 1.1
            }}
          >
            FOUNDERS HUT
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontWeight: 500,
              marginTop: '2px'
            }}
          >
            Where Builders Meet Builders
          </span>
        </div>
      )}
    </div>
  );
};
