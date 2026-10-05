import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MemberCard } from '../components/common/MemberCard';
import { EmptyState } from '../components/common/EmptyState';
import { Search } from 'lucide-react';
import { MatchingService } from '../services/matchingService';

const GUIDED_CHIPS = [
  { label: 'Finding my first customers', accent: 'var(--accent-blue)', bg: 'var(--blue-tint)' },
  { label: 'Raising capital', accent: 'var(--accent-gold)', bg: 'var(--gold-tint)' },
  { label: 'Hiring', accent: 'var(--accent-purple)', bg: 'var(--purple-tint)' },
  { label: 'Entering a new market', accent: 'var(--accent-emerald)', bg: 'var(--green-tint)' },
  { label: 'Finding a manufacturer', accent: 'var(--accent-coral)', bg: 'var(--coral-tint)' },
  { label: 'Pricing my product', accent: 'var(--accent-blue)', bg: 'var(--blue-tint)' }
];

export const HelpDeskView: React.FC = () => {
  const {
    currentUser,
    users,
    resolutions,
    setSelectedProfile,
    openIntroRequest,
    setIsCreateRequestOpen
  } = useApp();

  const [helpQuery, setHelpQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const activeTerm = selectedChip || helpQuery || '';
  const matchResults = activeTerm.trim()
    ? MatchingService.matchCandidatesForQuery(activeTerm, users, resolutions, currentUser, 5)
    : MatchingService.matchCandidatesForQuery('Founder advice & scaling', users, resolutions, currentUser, 3);

  const matches = matchResults.map((res) => ({
    ...res.candidate,
    matchReason: res.primaryReason || res.matchReasons[0]?.label
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Header Container */}
      <div className="fh-atmospheric-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            What are you trying to solve?
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Describe your business hurdle or select a common challenge below.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Describe your problem..."
            value={helpQuery}
            onChange={(e) => {
              setHelpQuery(e.target.value);
              setSelectedChip(null);
            }}
            style={{
              width: '100%',
              paddingLeft: '42px',
              paddingRight: '14px',
              paddingTop: '12px',
              paddingBottom: '12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Semantic Suggestion Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {GUIDED_CHIPS.map((chip) => {
            const isSelected = selectedChip === chip.label;
            return (
              <button
                key={chip.label}
                onClick={() => {
                  setSelectedChip(isSelected ? null : chip.label);
                  setHelpQuery('');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? `1px solid ${chip.accent}` : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? chip.bg : 'var(--bg-surface-elevated)',
                  color: isSelected ? chip.accent : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {isSelected ? '✓ ' : '+ '}{chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          People who may be able to help ({matches.length})
        </span>
        <button
          onClick={() => setIsCreateRequestOpen(true)}
          style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Ask the network &rarr;
        </button>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          title="No direct matches found"
          subtitle="Try refining your problem description or ask the network directly."
          actionLabel="Ask the network"
          onAction={() => setIsCreateRequestOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matches.map((member) => (
            <MemberCard
              key={member.id}
              currentUser={currentUser}
              member={member}
              onRequestIntro={(target) => openIntroRequest(target)}
              onViewProfile={(target) => setSelectedProfile(target)}
              showPathway={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
