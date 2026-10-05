import React, { useState } from 'react';
import type { Post, UserProfile } from '../../types';
import { Avatar } from '../common/Avatar';
import { ShieldCheck, MessageSquare, Share2, Bookmark, ExternalLink, ThumbsUp } from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: UserProfile;
  onUsefulToggle?: (postId: string) => void;
  onSaveToggle?: (postId: string) => void;
  onCommentAdd?: (postId: string, text: string) => void;
  onPrivateShare?: (post: Post) => void;
  onViewProfile?: (user: UserProfile) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onUsefulToggle,
  onSaveToggle,
  onCommentAdd,
  onPrivateShare,
  onViewProfile
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !onCommentAdd) return;
    onCommentAdd(post.id, commentInput.trim());
    setCommentInput('');
  };

  const handleCopyLink = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setShowShareMenu(false);
  };

  // Human visibility label (No raw enum names)
  const getVisibilityLabel = () => {
    if (post.visibility === 'PRIVATE') {
      return post.recipient ? `Shared privately with ${post.recipient.name.split(' ')[0]}` : 'Private';
    }
    if (post.visibility === 'COMMUNITY_ONLY') {
      return post.community ? `Visible to ${post.community.name}` : 'Community only';
    }
    return 'Visible to verified members';
  };

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'border-color var(--transition-fast)'
      }}
    >
      {/* Grounded Match Reason (if present) */}
      {post.matchReason && (
        <div style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
          ✦ {post.matchReason}
        </div>
      )}

      {/* Header: Author & Visibility */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <Avatar
            name={post.author.name}
            src={post.author.avatar}
            size="md"
            verificationLevel={post.author.verificationLevel}
            onClick={() => onViewProfile && onViewProfile(post.author)}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span
                onClick={() => onViewProfile && onViewProfile(post.author)}
                style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', cursor: onViewProfile ? 'pointer' : 'default' }}
              >
                {post.author.name}
              </span>
              <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
              {post.author.role} · {post.author.company}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{post.createdAt}</span>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: post.visibility === 'COMMUNITY_ONLY' ? 'var(--purple-tint)' : post.visibility === 'PRIVATE' ? 'var(--gold-tint)' : 'var(--bg-subtle)',
              color: post.visibility === 'COMMUNITY_ONLY' ? 'var(--accent-purple)' : post.visibility === 'PRIVATE' ? 'var(--accent-gold)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 500
            }}
          >
            {getVisibilityLabel()}
          </span>
        </div>
      </div>

      {/* Post Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {post.title && (
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {post.title}
          </h3>
        )}

        <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
          {post.body}
        </p>

        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--accent-blue)',
              marginTop: '0.25rem',
              width: 'fit-content'
            }}
          >
            <ExternalLink size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '360px' }}>
              {post.linkUrl}
            </span>
          </a>
        )}
      </div>

      {/* Footer Actions: Useful, Comments, Share, Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Useful Reaction (Single Reaction Type) */}
          <button
            data-testid="post-useful-btn"
            aria-pressed={post.isUsefulByMe}
            onClick={() => onUsefulToggle && onUsefulToggle(post.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: post.isUsefulByMe ? 'var(--gold-tint)' : 'transparent',
              color: post.isUsefulByMe ? 'var(--accent-gold)' : 'var(--text-muted)',
              border: post.isUsefulByMe ? '1px solid var(--accent-gold-border)' : '1px solid transparent',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ThumbsUp size={14} />
            <span>Useful</span>
            {post.usefulCount > 0 && <span style={{ opacity: 0.8 }}>({post.usefulCount})</span>}
          </button>

          {/* Comments Toggle */}
          <button
            data-testid="post-comment-toggle"
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              color: showComments ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={14} />
            <span>Comments ({post.commentsCount})</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
          {/* Save / Bookmark */}
          <button
            data-testid="post-save-btn"
            aria-pressed={post.isSavedByMe}
            onClick={() => onSaveToggle && onSaveToggle(post.id)}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: post.isSavedByMe ? 'var(--accent-gold)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
            title={post.isSavedByMe ? 'Saved' : 'Save post'}
          >
            <Bookmark size={15} fill={post.isSavedByMe ? 'var(--accent-gold)' : 'none'} />
          </button>

          {/* Share Menu */}
          <button
            data-testid="post-share-btn"
            onClick={() => setShowShareMenu(!showShareMenu)}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
            title="Share post"
          >
            <Share2 size={15} />
          </button>

          {showShareMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: '100%',
                marginBottom: '6px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10,
                minWidth: '160px'
              }}
            >
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {copiedLink ? '✓ Link copied' : 'Copy link'}
              </button>
              {onPrivateShare && (
                <button
                  data-testid="post-share-private-btn"
                  onClick={() => {
                    setShowShareMenu(false);
                    onPrivateShare(post);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Send privately...
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Comments Thread */}
      {showComments && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              data-testid="post-comment-input"
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              data-testid="post-comment-submit"
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--accent-gold)',
                color: '#090B0F',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Comment
            </button>
          </form>

          {/* List of Comments */}
          {post.comments && post.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    display: 'flex',
                    gap: '0.65rem',
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <Avatar name={comment.author.name} src={comment.author.avatar} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {comment.author.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{comment.createdAt}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No comments yet. Start the discussion.
            </div>
          )}
        </div>
      )}
    </article>
  );
};
