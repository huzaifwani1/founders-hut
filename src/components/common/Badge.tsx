import React from 'react';
import { ShieldCheck, Award, Building, UserCheck } from 'lucide-react';
import type { VerificationLevel } from '../../types';

interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ level, size = 'sm' }) => {
  if (level === 'verified_founder') {
    return (
      <span
        title="Verified Founder: Proves corporate domain + business entity + independent evidence of founder status (MCA Director filing / SEC / Cap table)."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: size === 'sm' ? '2px 8px' : '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          backgroundColor: 'var(--verified-green-bg)',
          color: 'var(--verified-green)',
          border: '1px solid var(--verified-green-border)',
          whiteSpace: 'nowrap'
        }}
      >
        <ShieldCheck size={size === 'sm' ? 12 : 14} />
        Verified Founder
      </span>
    );
  }

  if (level === 'verified_investor') {
    return (
      <span
        title="Verified Investor: Proves active VC firm domain + SEC / SEBI registration & verified portfolio filings."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: size === 'sm' ? '2px 8px' : '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          backgroundColor: 'rgba(168, 85, 247, 0.12)',
          color: 'var(--accent-purple)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          whiteSpace: 'nowrap'
        }}
      >
        <Award size={size === 'sm' ? 12 : 14} />
        Verified Investor
      </span>
    );
  }

  if (level === 'verified_professional' || level === 'verified_executive') {
    return (
      <span
        title="Verified Professional: Proves work email domain + registered business entity existence + active professional role."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: size === 'sm' ? '2px 8px' : '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          backgroundColor: 'var(--accent-gold-bg)',
          color: 'var(--accent-gold)',
          border: '1px solid var(--accent-gold-border)',
          whiteSpace: 'nowrap'
        }}
      >
        <Award size={size === 'sm' ? 12 : 14} />
        {level === 'verified_executive' ? 'Verified Executive' : 'Verified Professional'}
      </span>
    );
  }

  if (level === 'verified_member') {
    return (
      <span
        title="Verified Member: Proves work email domain ownership & active authentication (@company.com)."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: size === 'sm' ? '2px 8px' : '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
          fontWeight: 500,
          backgroundColor: 'var(--badge-bg)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          whiteSpace: 'nowrap'
        }}
      >
        <UserCheck size={size === 'sm' ? 12 : 14} />
        Verified Member
      </span>
    );
  }

  return (
    <span
      title="Verification Audit In Progress: Progressive background check active."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
        fontWeight: 500,
        backgroundColor: 'var(--badge-bg)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-subtle)',
        whiteSpace: 'nowrap'
      }}
    >
      <Building size={size === 'sm' ? 12 : 14} />
      {level === 'pending' ? 'Pending Review' : 'Unverified'}
    </span>
  );
};

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
}

export const Tag: React.FC<TagProps> = ({ children, variant = 'default', size = 'sm' }) => {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--badge-bg)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)'
    },
    accent: {
      backgroundColor: 'var(--accent-gold-bg)',
      color: 'var(--accent-gold)',
      border: '1px solid var(--accent-gold-border)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-subtle)'
    },
    subtle: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      color: 'var(--text-muted)',
      border: '1px solid rgba(255, 255, 255, 0.06)'
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: 'var(--radius-sm)',
        fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...styles[variant]
      }}
    >
      {children}
    </span>
  );
};

export const DevSeedBadge: React.FC<{ size?: 'sm' | 'md' }> = () => {
  return null;
};
