import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MemberCard } from '../components/common/MemberCard';
import { EmptyState } from '../components/common/EmptyState';
import { MatchingService } from '../services/matchingService';

type PeopleTab = 'people' | 'problems_solved';

export const DiscoverView: React.FC = () => {
  const {
    currentUser,
    users,
    resolutions,
    discoverSearch,
    setDiscoverSearch,
    discoverFilterRole,
    setDiscoverFilterRole,
    discoverFilterIndustry,
    setDiscoverFilterIndustry,
    setSelectedProfile,
    openIntroRequest,
    setIsCreateRequestOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<PeopleTab>('people');

  // People search
  const filteredPeople = useMemo(() => {
    if (activeTab !== 'people') return [];

    if (discoverSearch.trim()) {
      const results = MatchingService.matchCandidatesForQuery(
        discoverSearch, users, resolutions, currentUser, 10
      );
      return results.map((r) => ({
        ...r.candidate,
        matchReason: r.primaryReason || r.matchReasons[0]?.label
      }));
    }

    let filtered = users.filter((u) => u.id !== currentUser.id);

    if (discoverFilterRole) {
      filtered = filtered.filter((u) =>
        u.role.toLowerCase().includes(discoverFilterRole.toLowerCase())
      );
    }
    if (discoverFilterIndustry) {
      filtered = filtered.filter((u) =>
        u.industry?.toLowerCase().includes(discoverFilterIndustry.toLowerCase())
      );
    }

    return filtered;
  }, [activeTab, discoverSearch, discoverFilterRole, discoverFilterIndustry, users, resolutions, currentUser]);

  // Problems Solved search
  const problemsSolvedResults = useMemo(() => {
    if (activeTab !== 'problems_solved') return [];

    const verified = resolutions.filter((r) => r.status === 'VERIFIED');
    if (discoverSearch.trim()) {
      const q = discoverSearch.toLowerCase();
      return verified.filter(
        (r) =>
          r.summary?.toLowerCase().includes(q) ||
          r.outcomeCategory?.toLowerCase().includes(q) ||
          r.helpType?.toLowerCase().includes(q)
      );
    }
    return verified;
  }, [activeTab, discoverSearch, resolutions]);

  // Unique roles and industries for filters
  const uniqueRoles = useMemo(() => [...new Set(users.map((u) => u.role).filter(Boolean))], [users]);
  const uniqueIndustries = useMemo(() => [...new Set(users.map((u) => u.industry).filter(Boolean))], [users]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Find founders by problem, experience, or company..."
            value={discoverSearch}
            onChange={(e) => setDiscoverSearch(e.target.value)}
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

        {/* Two Tabs: People / Problems Solved */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'people' as PeopleTab, label: 'People' },
            { id: 'problems_solved' as PeopleTab, label: 'Problems solved' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === tab.id ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
                border: activeTab === tab.id ? '1px solid var(--accent-gold-border)' : '1px solid transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters — only for People tab */}
        {activeTab === 'people' && !discoverSearch.trim() && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={discoverFilterRole}
              onChange={(e) => setDiscoverFilterRole(e.target.value)}
              style={{
                padding: '6px 10px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All roles</option>
              {uniqueRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={discoverFilterIndustry}
              onChange={(e) => setDiscoverFilterIndustry(e.target.value)}
              style={{
                padding: '6px 10px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All industries</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* People Results */}
      {activeTab === 'people' && (
        <>
          {filteredPeople.length === 0 ? (
            <EmptyState
              title="No founders found"
              subtitle="Try a different search or describe a problem you need help with."
              actionLabel="Ask the network"
              onAction={() => setIsCreateRequestOpen(true)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredPeople.map((member) => (
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
        </>
      )}

      {/* Problems Solved Results */}
      {activeTab === 'problems_solved' && (
        <>
          {problemsSolvedResults.length === 0 ? (
            <EmptyState
              title="No verified outcomes yet"
              subtitle="Verified outcomes appear when introductions lead to real help."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {problemsSolvedResults.map((res) => {
                const helper = users.find((u) => u.id === res.helperId);
                return (
                  <div
                    key={res.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--verified-green-bg)', color: 'var(--verified-green)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {res.outcomeCategory || 'Verified'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{res.createdAt}</span>
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {res.summary || 'Verified outcome'}
                    </div>
                    {helper && (
                      <div
                        onClick={() => setSelectedProfile(helper)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{helper.name}</span>
                        <span>· {helper.role}, {helper.company}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
