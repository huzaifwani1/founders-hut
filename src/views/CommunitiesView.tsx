import React, { useState } from 'react';
import { MessageSquare, Plus, CheckCircle, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { PostCard } from '../components/posts/PostCard';
import type { Community } from '../types';

export const CommunitiesView: React.FC = () => {
  const {
    currentUser,
    users,
    communities,
    discussions,
    posts,
    joinCommunity,
    leaveCommunity,
    setIsCreateCommunityOpen,
    openCreatePost,
    setSelectedProfile,
    toggleUsefulPost,
    toggleSavePost,
    addCommentToPost,
    setSelectedPostForPrivateShare
  } = useApp();

  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const activeCommunity = selectedCommunity || communities[0] || null;
  const activeDiscussions = activeCommunity ? discussions.filter((d) => d.communityId === activeCommunity.id) : [];
  const communityPosts = activeCommunity ? posts.filter(
    (p) => p.communityId === activeCommunity.id || (p.visibility === 'COMMUNITY_ONLY' && p.community?.id === activeCommunity.id)
  ) : [];

  // If no community selected, show the directory
  if (!activeCommunity && communities.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center', gap: '1rem' }}>
        <Layers size={32} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Find a founder room relevant to what you're building
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
          Communities are private rooms where verified founders discuss shared challenges.
        </p>
        <button
          onClick={() => setIsCreateCommunityOpen(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--accent-gold)',
            color: '#090B0F',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Create a community
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Community Directory — card grid (not sidebar) */}
      {!selectedCommunity && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Private founder rooms for discussions and help.
              </p>
            </div>
            <button
              onClick={() => setIsCreateCommunityOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '6px 12px',
                backgroundColor: 'var(--accent-gold-bg)',
                color: 'var(--accent-gold)',
                border: '1px solid var(--accent-gold-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> New room
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {communities.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCommunity(c)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {c.name}
                  </h3>
                  {c.isJoined && <CheckCircle size={14} style={{ color: 'var(--accent-emerald)' }} />}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                  {c.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={13} />
                  <span>{c.membersCount || users.length} verified founders</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Single Community Room — full-width, no sidebar */}
      {activeCommunity && selectedCommunity && (
        <>
          {/* Back to directory */}
          <button
            onClick={() => setSelectedCommunity(null)}
            style={{
              fontSize: '0.82rem',
              color: 'var(--accent-gold)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '0'
            }}
          >
            ← All communities
          </button>

          {/* Room Header — simplified */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {activeCommunity.name}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                {activeCommunity.description}
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={13} />
                <span>{activeCommunity.membersCount || users.length} verified founders</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeCommunity.isJoined ? (
                <>
                  <button
                    onClick={() => openCreatePost(activeCommunity.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '8px 14px',
                      backgroundColor: 'var(--accent-gold)',
                      color: '#090B0F',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} /> Post
                  </button>
                  <button
                    onClick={() => leaveCommunity(activeCommunity.id)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Leave
                  </button>
                </>
              ) : (
                <button
                  onClick={() => joinCommunity(activeCommunity.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#090B0F',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Join room
                </button>
              )}
            </div>
          </div>

          {/* Discussions & Posts — single stream, no sub-tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {communityPosts.map((post) => (
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
            ))}

            {activeDiscussions.map((disc) => (
              <div
                key={disc.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Avatar name={disc.author.name} src={disc.author.avatar} size="sm" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {disc.author.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {disc.author.role} @ {disc.author.company} • {disc.createdAt}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {disc.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {disc.body}
                </div>
              </div>
            ))}

            {communityPosts.length === 0 && activeDiscussions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <MessageSquare size={28} style={{ color: 'var(--border-medium)', marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>No posts yet</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Be the first to share or ask a question.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Needed for the empty state import
const Layers = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
