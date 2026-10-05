import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction
}) => {
  return (
    <div className="fh-empty-state">
      <div className="fh-empty-state-icon">
        {icon || <ShieldAlert size={22} />}
      </div>
      <div className="fh-empty-state-title">{title}</div>
      <div className="fh-empty-state-subtitle">{subtitle}</div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '0.5rem',
            padding: '0.45rem 1.25rem',
            background: 'var(--accent-gold)',
            color: '#000',
            fontWeight: 600,
            fontSize: '0.82rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
