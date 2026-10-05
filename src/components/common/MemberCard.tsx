import React from 'react';
import type { UserProfile } from '../../types';
import { ShieldCheck, Sparkles, CheckCircle2, Users } from 'lucide-react';
import { Avatar } from './Avatar';
import { useApp } from '../../context/AppContext';
import { ResolutionService } from '../../services/resolutionService';

interface MemberCardProps {
  currentUser: UserProfile;
  member: UserProfile;
  onRequestIntro?: (target: UserProfile) => void;
  onViewProfile?: (member: UserProfile) => void;
  showPathway?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  currentUser,
  member,
  onRequestIntro,
  onViewProfile,
  showPathway = true
}) => {
  const { resolutions } = useApp();

  const summaries = ResolutionService.getProfileCategorySummaries(resolutions, member.id, currentUser.id);
  const topSummary = summaries[0];

  const pathway = member.pathway;
  const facilitator = pathway?.facilitator;

  return (
    <div className="fh-member-card">
      {/* Header: Avatar, Name, Role, Verified */}
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <Avatar
          name={member.name}
          src={member.avatar}
          size="lg"
          verificationLevel={member.verificationLevel}
          onClick={() => onViewProfile && onViewProfile(member)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <h3
              onClick={() => onViewProfile && onViewProfile(member)}
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                cursor: onViewProfile ? 'pointer' : 'default'
              }}
            >
              {member.name}
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--green-tint)',
                color: 'var(--accent-emerald)',
                border: '1px solid var(--verified-green-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={13} /> Verified
            </span>
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
            {member.role} · <strong style={{ color: 'var(--text-primary)' }}>{member.company}</strong>
          </div>
        </div>
      </div>

      {/* One concise match reason */}
      {member.matchReason ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <Sparkles size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
          <span>{member.matchReason}</span>
        </div>
      ) : member.bio ? (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
          {member.bio}
        </p>
      ) : null}

      {/* One trust signal */}
      {topSummary && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
          <CheckCircle2 size={13} />
          <span>{topSummary.count} verified {topSummary.category} {topSummary.count === 1 ? 'outcome' : 'outcomes'}</span>
        </div>
      )}

      {/* Connection pathway + CTA — compact */}
      {showPathway && pathway && facilitator && currentUser.id !== member.id && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.75rem',
            backgroundColor: 'var(--accent-gold-bg)',
            border: '1px solid var(--accent-gold-border)',
            borderRadius: 'var(--radius-md)',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Users size={15} style={{ color: 'var(--accent-gold)' }} />
            <span>{facilitator.name.split(' ')[0]} knows you both</span>
          </div>

          {onRequestIntro && (
            <button
              onClick={() => onRequestIntro(member)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--accent-gold)',
                color: '#000',
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
      )}

      {/* View profile link */}
      {onViewProfile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.15rem' }}>
          <button
            onClick={() => onViewProfile(member)}
            style={{
              fontSize: '0.82rem',
              color: 'var(--accent-gold)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            View profile →
          </button>
        </div>
      )}
    </div>
  );
};
