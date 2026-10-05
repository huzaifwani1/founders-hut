import React, { useState } from 'react';
import type { VerificationLevel } from '../../types';

interface AvatarProps {
  src?: string;
  initials?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verificationLevel?: VerificationLevel;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  initials,
  name,
  size = 'md',
  verificationLevel,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);

  const dimensions = {
    sm: 32,
    md: 42,
    lg: 56,
    xl: 72
  }[size];

  const fontSize = {
    sm: '0.75rem',
    md: '0.88rem',
    lg: '1.1rem',
    xl: '1.35rem'
  }[size];

  const derivedInitials =
    initials ||
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  // If src is an Unsplash placeholder or image errored, use initials
  const isUnsplash = src?.includes('unsplash.com');
  const showImage = src && !isUnsplash && !imageError;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: `${dimensions}px`,
        height: `${dimensions}px`,
        borderRadius: 'var(--radius-md)',
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-family)',
              fontWeight: 700,
              fontSize,
              color: 'var(--accent-gold)',
              letterSpacing: '0.04em'
            }}
          >
            {derivedInitials}
          </span>
        )}
      </div>

      {verificationLevel === 'verified_founder' && (
        <div
          title="Verified Member"
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: size === 'sm' ? '10px' : '12px',
            height: size === 'sm' ? '10px' : '12px',
            backgroundColor: 'var(--verified-green)',
            border: '2px solid var(--bg-surface)',
            borderRadius: '50%'
          }}
        />
      )}
    </div>
  );
};
