import React, { useState } from 'react';
import { Search, CheckCircle2, Sparkles, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { IntroductionCard } from '../components/common/IntroductionCard';
import { MatchingService } from '../services/matchingService';
import { ResolutionService } from '../services/resolutionService';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    users,
    requests,
    introductions,
    resolutions,
    notifications,
    setActiveTab,
    setSelectedProfile,
    openIntroRequest,
    setSelectedRequestForHelp,
    acceptIntroduction,
    declineIntroduction,
    setActiveConversationId,
    setIsCreateRequestOpen,
    markNotificationRead,
    confirmResolution
  } = useApp();

  const [problemQuery, setProblemQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Matched people based on problem query
  const matchResults = hasSearched && problemQuery.trim()
    ? MatchingService.matchCandidatesForQuery(problemQuery, users, resolutions, currentUser, 3)
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemQuery.trim()) {
      setHasSearched(true);
    }
  };

  // Needs Your Attention — pending intros and unread notifications (max 2)
  const pendingIntros = introductions.filter(
    (i) => i.status === 'REQUESTED' && (currentUser.id === i.facilitator?.id || currentUser.id === i.toUser?.id)
  );
  const unconfirmedResolutions = notifications.filter(
    (n) => !n.isRead && n.type === 'RESOLUTION_PROMPT' && n.targetId
  );
  const hasAttentionItems = pendingIntros.length > 0 || unconfirmedResolutions.length > 0;

  // Someone You Should Know — one strong recommendation
  const suggestedMatch = MatchingService.matchCandidatesForQuery(
    'Founder advice & scaling', users, resolutions, currentUser, 1
  )[0];
  const suggestedPerson = suggestedMatch ? {
    ...suggestedMatch.candidate,
    matchReason: suggestedMatch.primaryReason || suggestedMatch.matchReasons[0]?.label
  } : null;

  // A Request You Can Help With — one relevant open request
  const openRequests = requests.filter((r) => r.status === 'open' && r.authorId !== currentUser.id);
  const relevantRequest = openRequests[0] || null;

  // Get resolution summaries for suggested person
  const suggestedSummaries = suggestedPerson
    ? ResolutionService.getProfileCategorySummaries(resolutions, suggestedPerson.id, currentUser.id)
    : [];
  const topSummary = suggestedSummaries[0];

  const exampleChips = [
    'Closing my first enterprise deal',
    'Pricing my SaaS',
    'Hiring my first SDR',
    'Fundraising',
    'SOC2 compliance',
    'International expansion'
  ];

  return (
    <div className="fh-home-container">
      {/* 1. GREETING + PROBLEM INPUT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {greeting}, {currentUser.name.split(' ')[0]}.
          </h2>
        </div>

        <div className="fh-atmospheric-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
              What do you need help with?
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
              Describe your challenge. We'll find verified founders who've solved similar problems.
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Describe the business problem you're facing..."
                  value={problemQuery}
                  onChange={(e) => {
                    setProblemQuery(e.target.value);
                    if (!e.target.value.trim()) setHasSearched(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#090B0F',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                Search verified founders →
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              We'll match you with verified founders who have solved similar problems.
            </div>

            {/* Example Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
              {exampleChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setProblemQuery(chip);
                    setHasSearched(true);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* INLINE SEARCH RESULTS */}
      {hasSearched && matchResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              We found {matchResults.length} {matchResults.length === 1 ? 'founder' : 'founders'} who may be able to help
            </span>
            <button
              onClick={() => setIsCreateRequestOpen(true)}
              style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Ask the network →
            </button>
          </div>

          {matchResults.map((match) => {
            const summaries = ResolutionService.getProfileCategorySummaries(resolutions, match.candidate.id, currentUser.id);
            const matchTopSummary = summaries[0];
            return (
              <div
                key={match.candidate.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <Avatar
                    name={match.candidate.name}
                    src={match.candidate.avatar}
                    size="md"
                    verificationLevel={match.candidate.verificationLevel}
                    onClick={() => setSelectedProfile(match.candidate)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        onClick={() => setSelectedProfile(match.candidate)}
                        style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        {match.candidate.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      {match.candidate.role} · {match.candidate.company}
                    </div>
                  </div>
                </div>

                {/* Why this matches */}
                {(match.primaryReason || match.matchReasons[0]) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                    <span>{match.primaryReason || match.matchReasons[0]?.label}</span>
                  </div>
                )}

                {/* Trust signal */}
                {matchTopSummary && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    <CheckCircle2 size={13} />
                    <span>{matchTopSummary.count} verified {matchTopSummary.category} {matchTopSummary.count === 1 ? 'outcome' : 'outcomes'}</span>
                  </div>
                )}

                {/* Pathway + CTA */}
                {match.candidate.pathway && currentUser.id !== match.candidate.id && (
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
                      <span>{match.candidate.pathway.facilitator.name.split(' ')[0]} knows you both</span>
                    </div>
                    <button
                      onClick={() => openIntroRequest(match.candidate)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--accent-gold)',
                        color: '#090B0F',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Ask {match.candidate.pathway.facilitator.name.split(' ')[0]} to introduce you
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasSearched && matchResults.length === 0 && problemQuery.trim() && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            No strong match yet for "{problemQuery}"
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>
            Post this as a request — we'll notify relevant founders as they join.
          </p>
          <button
            onClick={() => setIsCreateRequestOpen(true)}
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--accent-gold)',
              color: '#090B0F',
              fontWeight: 600,
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Post request →
          </button>
        </div>
      )}

      {/* 2. NEEDS YOUR ATTENTION — only when genuine pending items exist */}
      {!hasSearched && hasAttentionItems && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Needs your attention
          </h3>

          {/* Pending intro (show max 1) */}
          {pendingIntros.slice(0, 1).map((intro) => (
            <IntroductionCard
              key={intro.id}
              intro={intro}
              currentUser={currentUser}
              onAccept={acceptIntroduction}
              onDecline={declineIntroduction}
              onOpenConversation={(i) => {
                setActiveConversationId(i.id);
                setActiveTab('messages');
              }}
            />
          ))}

          {/* Unconfirmed resolution (show max 1) */}
          {pendingIntros.length === 0 && unconfirmedResolutions.slice(0, 1).map((notif) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{notif.detail}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <button
                  onClick={() => { confirmResolution(notif.targetId!, true); markNotificationRead(notif.id); }}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Confirm
                </button>
                <button
                  onClick={() => { confirmResolution(notif.targetId!, false); markNotificationRead(notif.id); }}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. SOMEONE YOU SHOULD KNOW — one strong recommendation (only when not searching) */}
      {!hasSearched && suggestedPerson && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Someone you should know
          </h3>

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
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <Avatar
                name={suggestedPerson.name}
                src={suggestedPerson.avatar}
                size="lg"
                verificationLevel={suggestedPerson.verificationLevel}
                onClick={() => setSelectedProfile(suggestedPerson)}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span
                  onClick={() => setSelectedProfile(suggestedPerson)}
                  style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {suggestedPerson.name}
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  {suggestedPerson.role} · {suggestedPerson.company}
                </div>
              </div>
            </div>

            {suggestedPerson.matchReason && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <Sparkles size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                <span>{suggestedPerson.matchReason}</span>
              </div>
            )}

            {topSummary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                <span>{topSummary.count} verified {topSummary.category} {topSummary.count === 1 ? 'outcome' : 'outcomes'}</span>
              </div>
            )}

            {suggestedPerson.pathway && currentUser.id !== suggestedPerson.id && (
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
                  <span>{suggestedPerson.pathway.facilitator.name.split(' ')[0]} knows you both</span>
                </div>
                <button
                  onClick={() => openIntroRequest(suggestedPerson)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#090B0F',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Ask {suggestedPerson.pathway.facilitator.name.split(' ')[0]} to introduce you
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. A REQUEST YOU CAN HELP WITH — one relevant request (only when not searching + no suggestion shown or below) */}
      {!hasSearched && relevantRequest && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            A request you can help with
          </h3>

          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-gold-bg)',
              color: 'var(--accent-gold)',
              fontWeight: 600,
              textTransform: 'uppercase',
              alignSelf: 'flex-start'
            }}>
              {relevantRequest.needCategory}
            </span>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.35 }}>
              "{relevantRequest.title}"
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Avatar name={relevantRequest.author.name} src={relevantRequest.author.avatar} size="sm" />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{relevantRequest.author.name}</strong> · {relevantRequest.author.role}, {relevantRequest.author.company}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedRequestForHelp(relevantRequest)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Offer help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
