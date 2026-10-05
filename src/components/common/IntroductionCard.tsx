import React from 'react';
import type { Introduction, UserProfile } from '../../types';
import { CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { Avatar } from './Avatar';

interface IntroductionCardProps {
  intro: Introduction;
  currentUser: UserProfile;
  onAccept?: (introId: string, note?: string) => void;
  onDecline?: (introId: string) => void;
  onOpenConversation?: (intro: Introduction) => void;
}

export const IntroductionCard: React.FC<IntroductionCardProps> = ({
  intro,
  currentUser,
  onAccept,
  onDecline,
  onOpenConversation
}) => {
  const isFacilitator = currentUser.id === intro.facilitator?.id;
  const isTarget = currentUser.id === (intro.toUser?.id || (intro as any).suggestedUserId);

  const [personalNote] = React.useState('');
  const [showNoteForm, setShowNoteForm] = React.useState(false);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-gold-bg)',
            color: 'var(--accent-gold)',
            fontWeight: 600
          }}
        >
          {isFacilitator
            ? `${intro.fromUser.name} wants to meet ${intro.toUser.name}`
            : isTarget
              ? `Introduction from ${intro.fromUser.name}`
              : `Waiting for ${intro.facilitator.name.split(' ')[0]}'s review`}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{intro.createdAt}</span>
      </div>

      {/* People Involved Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Avatar name={intro.fromUser.name} src={intro.fromUser.avatar} size="sm" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{intro.fromUser.name}</span>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>wants to meet</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Avatar name={intro.toUser.name} src={intro.toUser.avatar} size="sm" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{intro.toUser.name}</span>
        </div>
      </div>

      {/* Reason */}
      <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
          Context
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, fontStyle: 'italic' }}>
          "{intro.reason}"
        </p>
      </div>

      {/* Target Action Form (Add personal note) */}
      {isTarget && intro.status === 'REQUESTED' && showNoteForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-gold-border)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowNoteForm(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Not now
            </button>
            <button
              onClick={() => onAccept && onAccept(intro.id, personalNote)}
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--accent-gold)',
                color: '#000000',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Accept introduction
            </button>
          </div>
        </div>
      ) : isTarget && intro.status === 'REQUESTED' ? (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onDecline && onDecline(intro.id)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <XCircle size={15} /> Decline
          </button>
          <button
            data-testid="accept-intro-btn"
            onClick={() => {
              if (onAccept) {
                onAccept(intro.id, personalNote);
              } else {
                setShowNoteForm(true);
              }
            }}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: 'var(--accent-gold)',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={15} /> Accept introduction
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
            {intro.status === 'ACCEPTED' || intro.status === 'CONNECTED' ? (
              <>
                <CheckCircle2 size={16} style={{ color: 'var(--verified-green)' }} />
                <span style={{ color: 'var(--verified-green)', fontWeight: 600 }}>Introduction Made</span>
              </>
            ) : intro.status === 'DECLINED' ? (
              <>
                <XCircle size={16} style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Declined</span>
              </>
            ) : (
              <>
                <Clock size={16} style={{ color: 'var(--accent-gold)' }} />
                <span style={{ color: 'var(--accent-gold)', fontWeight: 500 }}>Pending response from {intro.toUser?.name ? intro.toUser.name.split(' ')[0] : 'target founder'}</span>
              </>
            )}
          </div>

          {(intro.status === 'ACCEPTED' || intro.status === 'CONNECTED') && onOpenConversation && (
            <button
              onClick={() => onOpenConversation(intro)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={14} /> Open 3-way conversation
            </button>
          )}
        </div>
      )}
    </div>
  );
};
