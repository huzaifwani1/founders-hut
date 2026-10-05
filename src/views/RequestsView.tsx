import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RequestCard } from '../components/common/RequestCard';
import { EmptyState } from '../components/common/EmptyState';
import { Plus, Inbox } from 'lucide-react';

export const RequestsView: React.FC = () => {
  const {
    currentUser,
    requests,
    resolveRequest,
    setSelectedRequestForHelp,
    setIsCreateRequestOpen,
    setActiveTab
  } = useApp();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Requests' },
    { id: 'Market Expansion', label: 'Expansion' },
    { id: 'Fundraising & Advisory', label: 'Fundraising' },
    { id: 'Hiring & Talent', label: 'Hiring' },
    { id: 'Vendor & Tech Stack', label: 'Technology' }
  ];

  const filteredRequests = requests.filter((r) => {
    if (activeCategoryFilter === 'all') return true;
    return r.needCategory === activeCategoryFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Top Header bar with CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Requests
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
            Business problems worth solving.
          </p>
        </div>

        <button
          onClick={() => setIsCreateRequestOpen(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--accent-gold)',
            color: '#000000',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Ask the network
        </button>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryFilter(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: activeCategoryFilter === cat.id ? 'var(--accent-gold-bg)' : 'var(--bg-surface)',
              border: activeCategoryFilter === cat.id ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              color: activeCategoryFilter === cat.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          title="No requests in this category"
          subtitle="Be the first verified member to ask the network."
          icon={<Inbox size={26} />}
          actionLabel="Ask the network"
          onAction={() => setIsCreateRequestOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              currentUser={currentUser}
              onOfferHelp={() => setSelectedRequestForHelp(req)}
              onSuggestPerson={() => setActiveTab('discover')}
              onMarkResolved={resolveRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};
