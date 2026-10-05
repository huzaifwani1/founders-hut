import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { EmptyState } from '../components/common/EmptyState';
import { formatEnumLabel } from '../types';

export const InvestorsView: React.FC = () => {
  const { investors, openIntroRequest } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const types = ['ALL', 'VC', 'ANGEL', 'FAMILY_OFFICE', 'SYNDICATE'];

  const filteredInvestors = investors.filter((inv) => {
    if (selectedType !== 'ALL' && inv.investorType !== selectedType) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = inv.user.name.toLowerCase().includes(q);
      const firmMatch = inv.firmName ? inv.firmName.toLowerCase().includes(q) : false;
      const sectorMatch = inv.sectors.some((s) => s.toLowerCase().includes(q));
      const focusMatch = inv.currentFocus ? inv.currentFocus.toLowerCase().includes(q) : false;
      return nameMatch || firmMatch || sectorMatch || focusMatch;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Search */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by firm, stage, sector, or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Type Filter — simplified single row */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-full)',
              border: selectedType === t ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              backgroundColor: selectedType === t ? 'var(--accent-gold-bg)' : 'transparent',
              color: selectedType === t ? 'var(--accent-gold)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            {t === 'ALL' ? 'All' : formatEnumLabel(t)}
          </button>
        ))}
      </div>

      {/* Investor Cards */}
      {filteredInvestors.length === 0 ? (
        <EmptyState
          title="No investors match your search"
          subtitle="Try adjusting your filters or search terms."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredInvestors.map((inv) => (
            <div
              key={inv.id}
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
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Avatar name={inv.user.name} src={inv.user.avatar} size="md" />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {inv.user.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    {formatEnumLabel(inv.investorType)} · {inv.firmName}
                  </div>
                </div>
              </div>

              {/* Stage & Cheque — compact */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>{inv.stageFocus.map(s => formatEnumLabel(s)).join(', ')}</span>
                <span style={{ color: 'var(--text-muted)' }}> · </span>
                <span>{inv.chequeRangeMin} – {inv.chequeRangeMax}</span>
              </div>

              {/* Current Focus */}
              {inv.currentFocus && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {inv.currentFocus}
                </p>
              )}

              {/* Pathway — who can introduce */}
              {inv.user.pathway && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <Users size={13} style={{ color: 'var(--accent-gold)' }} />
                  <span>{inv.user.pathway.facilitator.name.split(' ')[0]} knows you both</span>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => openIntroRequest(inv.user)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#000000',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 'auto'
                }}
              >
                Ask for an introduction
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
