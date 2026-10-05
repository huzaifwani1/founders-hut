import React from 'react';
import type { UserProfile } from '../../types';
import { Users, ArrowRight } from 'lucide-react';
import { Avatar } from './Avatar';

interface PathwayVisualizerProps {
  currentUser: UserProfile;
  targetUser: UserProfile;
  onRequestIntro?: () => void;
  detailedGraph?: boolean;
}

export const PathwayVisualizer: React.FC<PathwayVisualizerProps> = ({
  currentUser,
  targetUser,
  onRequestIntro,
  detailedGraph = false
}) => {
  const pathway = targetUser.pathway;

  if (!pathway) return null;

  const facilitator = pathway.facilitator;

  if (!detailedGraph) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 0.85rem',
          backgroundColor: 'var(--accent-gold-bg)',
          border: '1px solid var(--accent-gold-border)',
          borderRadius: 'var(--radius-md)',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          <Users size={16} style={{ color: 'var(--accent-gold)' }} />
          <span>✦ {facilitator.name.split(' ')[0]} knows you both</span>
        </div>

        {onRequestIntro && (
          <button
            onClick={onRequestIntro}
            style={{
              padding: '0.35rem 0.75rem',
              backgroundColor: 'var(--accent-gold)',
              color: '#000000',
              fontWeight: 600,
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Ask {facilitator.name.split(' ')[0]} to introduce you
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1.25rem',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600 }}>
          <Users size={16} />
          <span>{facilitator.name.split(' ')[0]} knows you both</span>
        </div>
        {onRequestIntro && (
          <button
            onClick={onRequestIntro}
            style={{
              padding: '0.4rem 0.85rem',
              backgroundColor: 'var(--accent-gold)',
              color: '#000000',
              fontWeight: 600,
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Ask {facilitator.name.split(' ')[0]} to introduce you
          </button>
        )}
      </div>

      {/* Visual Connection Pathway Moment */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '1rem 0.5rem',
          backgroundColor: 'var(--bg-main)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Avatar name={currentUser.name} src={currentUser.avatar} size="md" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {currentUser.name.split(' ')[0]}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, maxWidth: '100px' }}>
          <div style={{ width: '100%', height: '2px', backgroundColor: 'var(--accent-gold)', borderRadius: '2px' }} />
          <ArrowRight size={14} style={{ color: 'var(--accent-gold)', marginTop: '-8px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Avatar name={facilitator.name} src={facilitator.avatar} size="md" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {facilitator.name}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 500 }}>
            Facilitator
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, maxWidth: '100px' }}>
          <div style={{ width: '100%', height: '2px', backgroundColor: 'var(--accent-gold)', borderRadius: '2px' }} />
          <ArrowRight size={14} style={{ color: 'var(--accent-gold)', marginTop: '-8px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Avatar name={targetUser.name} src={targetUser.avatar} size="md" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {targetUser.name.split(' ')[0]}
          </span>
        </div>
      </div>
    </div>
  );
};
