import React, { useState } from 'react';
import type { BusinessRequest, UserProfile } from '../../types';
import { Avatar } from './Avatar';
import { ShieldCheck, CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResolutionService } from '../../services/resolutionService';
import { MatchingService } from '../../services/matchingService';

interface RequestCardProps {
  request: BusinessRequest;
  currentUser: UserProfile;
  onOfferHelp?: (request: BusinessRequest) => void;
  onSuggestPerson?: (request: BusinessRequest) => void;
  onMarkResolved?: (requestId: string, resolutionContext: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  currentUser,
  onOfferHelp,
  onMarkResolved
}) => {
  const { resolutions, users, openIntroRequest, openResolutionPrompt, setSelectedProfile } = useApp();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [resolutionText, setResolutionText] = useState('Resolved through an introduction.');

  const isAuthor = currentUser.id === request.authorId;

  // Query Candidate Matches via MatchingService
  const candidateMatches = MatchingService.matchCandidatesForRequest(
    request,
    users,
    resolutions,
    currentUser,
    3
  );

  // Query Grounded Resolvers from actual ResolutionRecords
  const groundedResolvers = ResolutionService.getResolversForRequest(
    request,
    resolutions,
    users,
    currentUser.id
  );

  // Show 1 match by default, rest on expand
  const visibleMatches = showAllMatches ? candidateMatches : candidateMatches.slice(0, 1);
  const hiddenCount = candidateMatches.length - 1;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}
    >
      {/* Category & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-gold-bg)',
              color: 'var(--accent-gold)',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            {request.needCategory}
          </span>
          {request.conciergeStatus === 'CONCIERGE_REVIEW' && (
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--purple-tint)', fontWeight: 600 }}>
              Reviewed by Founders Hut
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {request.createdAt}
        </span>
      </div>

      {/* What is being asked */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.35 }}>
        "{request.title}"
      </h3>

      {/* Author Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <Avatar
          name={request.author?.name || 'Founder'}
          src={request.author?.avatar}
          size="sm"
        />
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{request.author?.name || 'Founder'}</strong>
          {request.author?.role ? ` · ${request.author.role}` : ''}
          {request.author?.company ? `, ${request.author.company}` : ''}
        </div>
      </div>

      {/* PEOPLE WHO MAY BE ABLE TO HELP — Progressive Disclosure */}
      {visibleMatches.length > 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            marginTop: '0.25rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} />
            People who may be able to help
          </div>

          {visibleMatches.map((match) => (
            <div
              key={match.candidate.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                <Avatar
                  name={match.candidate.name}
                  src={match.candidate.avatar}
                  size="sm"
                  onClick={() => setSelectedProfile(match.candidate)}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {match.candidate.name} · <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{match.candidate.role}, {match.candidate.company}</span>
                  </div>

                  {/* Concise match reason */}
                  {match.matchReasons[0] && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {match.matchReasons[0].label}
                    </div>
                  )}
                </div>
              </div>

              {currentUser.id !== match.candidate.id && (
                <button
                  onClick={() => openIntroRequest(match.candidate)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'var(--gold-tint)',
                    color: 'var(--accent-gold)',
                    border: '1px solid var(--accent-gold-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Request intro <ArrowRight size={12} />
                </button>
              )}
            </div>
          ))}

          {/* "See X more" toggle */}
          {!showAllMatches && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllMatches(true)}
              style={{
                fontSize: '0.78rem',
                color: 'var(--accent-gold)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 0'
              }}
            >
              <ChevronDown size={14} />
              See {hiddenCount} more {hiddenCount === 1 ? 'match' : 'matches'}
            </button>
          )}
        </div>
      ) : (
        /* Fallback No-Response Experience */
        <div
          style={{
            padding: '0.75rem 0.85rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>
            {request.conciergeStatus === 'CONCIERGE_REVIEW' ? 'Being reviewed by Founders Hut' : 'Still looking for matches'}
          </strong>
          <span>
            {request.conciergeStatus === 'CONCIERGE_REVIEW'
              ? 'We\'re reviewing this request to identify verified founders who can help.'
              : 'We\'ll keep looking as more relevant verified founders join the network.'}
          </span>
        </div>
      )}

      {/* Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.25rem' }}>
        {request.status !== 'resolved' && onOfferHelp && !isAuthor && (
          <button
            onClick={() => onOfferHelp(request)}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--accent-gold)',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Offer help
          </button>
        )}

        {isAuthor && groundedResolvers.length > 0 && (
          <button
            onClick={() => openResolutionPrompt(request, groundedResolvers[0].resolver)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--gold-tint)',
              color: 'var(--accent-gold)',
              border: '1px solid var(--accent-gold-border)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle2 size={13} /> Did this help?
          </button>
        )}

        {isAuthor && onMarkResolved && (
          <button
            onClick={() => setShowResolveModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--verified-green-bg)',
              color: 'var(--verified-green)',
              border: '1px solid var(--verified-green-border)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Mark resolved
          </button>
        )}
      </div>

      {/* Resolve Dialog */}
      {showResolveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              maxWidth: '420px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Mark request as resolved</h3>
            <input
              type="text"
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Resolved through an introduction to Ananya Sharma"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowResolveModal(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onMarkResolved) onMarkResolved(request.id, resolutionText);
                  setShowResolveModal(false);
                }}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
