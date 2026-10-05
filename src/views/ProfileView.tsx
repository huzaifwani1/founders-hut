import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MemberCard } from '../components/common/MemberCard';
import { PostCard } from '../components/posts/PostCard';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { CheckCircle2, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { ApiClient } from '../services/api';

type ProfileTab = 'about' | 'track_record' | 'activity';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    users,
    posts,
    resolutions,
    openIntroRequest,
    setSelectedProfile,
    toggleUsefulPost,
    toggleSavePost,
    addCommentToPost,
    setSelectedPostForPrivateShare,
    setIsVerificationModalOpen,
    setIsAuthenticated
  } = useApp();

  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);

  const myPosts = posts.filter((p) => p.author.id === currentUser.id);
  const myResolutions = resolutions.filter(
    (r) => r.helperId === currentUser.id && r.status === 'VERIFIED'
  );

  const verifiedPillarCount = [
    currentUser.verificationPillars?.identityVerified,
    currentUser.verificationPillars?.corporateDomainVerified,
    currentUser.verificationPillars?.entityVerified,
    currentUser.verificationPillars?.founderStatusVerified
  ].filter(Boolean).length;

  const handleSignOut = () => {
    ApiClient.clearTokens();
    setIsAuthenticated(false);
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
      {/* Header: Sign Out */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          data-testid="sign-out-btn"
          onClick={handleSignOut}
          style={{
            padding: '6px 14px',
            backgroundColor: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Profile Card — simplified MemberCard */}
      <MemberCard
        currentUser={currentUser}
        member={currentUser}
        onRequestIntro={(target) => openIntroRequest(target)}
        onViewProfile={(member) => setSelectedProfile(member)}
        showPathway={false}
      />

      {/* Verification — collapsed single badge */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem'
        }}
      >
        <div
          onClick={() => setShowVerificationDetails(!showVerificationDetails)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentUser.verificationLevel === 'verified_founder' ? 'Verified Founder' :
                currentUser.verificationLevel === 'verified_executive' ? 'Verified Executive' :
                  currentUser.verificationLevel === 'verified_member' ? 'Verified Member' :
                    'Unverified'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              · {verifiedPillarCount} of 4 trust checks completed
            </span>
          </div>
          {showVerificationDetails ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>

        {showVerificationDetails && (
          <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
            {[
              { label: 'Identity', verified: currentUser.verificationPillars?.identityVerified },
              { label: 'Work email', verified: currentUser.verificationPillars?.corporateDomainVerified },
              { label: 'Company', verified: currentUser.verificationPillars?.entityVerified },
              { label: 'Founder status', verified: currentUser.verificationPillars?.founderStatusVerified }
            ].map((pillar) => (
              <div key={pillar.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: pillar.verified ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                  {pillar.verified ? '✓' : '○'}
                </span>
                <span style={{ color: pillar.verified ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {pillar.label}
                </span>
              </div>
            ))}
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              style={{
                fontSize: '0.78rem',
                color: 'var(--accent-gold)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'left',
                marginTop: '0.35rem'
              }}
            >
              Complete verification →
            </button>
          </div>
        )}
      </div>

      {/* Tabs: About / Track Record / Activity */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'about' as ProfileTab, label: 'About' },
          { id: 'track_record' as ProfileTab, label: `Track record (${myResolutions.length})` },
          { id: 'activity' as ProfileTab, label: `Posts (${myPosts.length})` }
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
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* About Tab */}
      {activeTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentUser.bio && (
            <Card>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {currentUser.bio}
              </p>
            </Card>
          )}

          {currentUser.canHelpWith && currentUser.canHelpWith.length > 0 && (
            <Card title="Can help with">
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {currentUser.canHelpWith.map((item) => (
                  <span key={item} className="fh-tag-pill">{item}</span>
                ))}
              </div>
            </Card>
          )}

          {currentUser.lookingFor && currentUser.lookingFor.length > 0 && (
            <Card title="Currently looking for">
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {currentUser.lookingFor.map((item) => (
                  <span key={item} className="fh-tag-pill">{item}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Track Record Tab */}
      {activeTab === 'track_record' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myResolutions.length === 0 ? (
            <EmptyState
              title="No verified outcomes yet"
              subtitle="Verified outcomes are created when introductions lead to real help."
            />
          ) : (
            myResolutions.map((res) => {
              const asker = users.find((u) => u.id === res.askerId);
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
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {res.summary || 'Verified outcome'}
                  </div>
                  {asker && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Helped {asker.name} · {asker.company}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Activity / Posts Tab */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myPosts.length === 0 ? (
            <EmptyState
              title="No posts yet"
              subtitle="Share your knowledge or insights with the network."
            />
          ) : (
            myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onUsefulToggle={toggleUsefulPost}
                onSaveToggle={toggleSavePost}
                onCommentAdd={addCommentToPost}
                onPrivateShare={setSelectedPostForPrivateShare}
                onViewProfile={setSelectedProfile}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
