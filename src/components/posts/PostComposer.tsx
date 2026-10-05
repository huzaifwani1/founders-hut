import React, { useState } from 'react';
import type { Community, PostType, PostVisibility, UserProfile } from '../../types';
import { Globe, Users, Lock, Link as LinkIcon, FileText, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';

interface PostComposerProps {
  currentUser?: UserProfile;
  communities?: Community[];
  users?: UserProfile[];
  onSubmit?: (postData: {
    type: PostType;
    title?: string;
    body: string;
    linkUrl?: string;
    visibility: PostVisibility;
    communityId?: string;
    recipientId?: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
  defaultCommunityId?: string;
}

export const PostComposer: React.FC<PostComposerProps> = (props) => {
  const appContext = useApp();
  const isCreatePostOpen = appContext.isCreatePostOpen;

  const currentUser = props.currentUser || appContext.currentUser;
  const communities = props.communities || appContext.communities;
  const users = props.users || appContext.users;
  const onSubmit = props.onSubmit || appContext.addPost;
  const onCancel = props.onCancel || (() => appContext.setIsCreatePostOpen(false));
  const defaultCommunityId = props.defaultCommunityId || appContext.createPostCommunityId || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [postType, setPostType] = useState<PostType>('SHORT_POST');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(defaultCommunityId ? 'COMMUNITY_ONLY' : 'PUBLIC_TO_VERIFIED_NETWORK');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(defaultCommunityId || (communities[0]?.id || ''));
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(users.find((u) => u.id !== currentUser.id)?.id || '');

  const isGlobalModal = props.onCancel === undefined;

  React.useEffect(() => {
    if (defaultCommunityId) {
      setVisibility('COMMUNITY_ONLY');
      setSelectedCommunityId(defaultCommunityId);
    }
  }, [defaultCommunityId, isCreatePostOpen]);

  if (isGlobalModal && !isCreatePostOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmit({
        type: postType,
        title: postType === 'ARTICLE' || postType === 'LINK' ? title.trim() : undefined,
        body: body.trim(),
        linkUrl: postType === 'LINK' ? linkUrl.trim() : undefined,
        visibility,
        communityId: visibility === 'COMMUNITY_ONLY' ? selectedCommunityId : undefined,
        recipientId: visibility === 'PRIVATE' ? selectedRecipientId : undefined
      });

      setTitle('');
      setBody('');
      setLinkUrl('');
      if (isGlobalModal) {
        onCancel();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish post. Please check your content and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVisibilityPreview = () => {
    if (visibility === 'PRIVATE') {
      const recipient = users.find((u) => u.id === selectedRecipientId);
      return recipient ? `Shared privately with ${recipient.name}` : 'Shared privately';
    }
    if (visibility === 'COMMUNITY_ONLY') {
      const community = communities.find((c) => c.id === selectedCommunityId);
      return community ? `Visible to members of ${community.name}` : 'Visible to community members';
    }
    return 'Visible to all verified members in Founders Hut';
  };

  const formContent = (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: isGlobalModal ? 'transparent' : 'var(--bg-surface-elevated)',
        border: isGlobalModal ? 'none' : '1px solid var(--border-medium)',
        borderRadius: isGlobalModal ? '0' : 'var(--radius-lg)',
        padding: isGlobalModal ? '0' : '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%'
      }}
    >
      {!isGlobalModal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
            What are you thinking about?
          </h3>
          <button
            type="button"
            onClick={onCancel}
            style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem'
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'SHORT_POST', label: 'Post', icon: <MessageSquare size={15} /> },
          { id: 'ARTICLE', label: 'Article', icon: <FileText size={15} /> },
          { id: 'LINK', label: 'Link', icon: <LinkIcon size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPostType(tab.id as PostType)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: postType === tab.id ? 'var(--accent-gold-bg)' : 'transparent',
              border: postType === tab.id ? '1px solid var(--accent-gold-border)' : '1px solid transparent',
              color: postType === tab.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Visibility Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Who will see this?
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setVisibility('PUBLIC_TO_VERIFIED_NETWORK')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: visibility === 'PUBLIC_TO_VERIFIED_NETWORK' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              backgroundColor: visibility === 'PUBLIC_TO_VERIFIED_NETWORK' ? 'var(--accent-gold-bg)' : 'var(--bg-main)',
              color: visibility === 'PUBLIC_TO_VERIFIED_NETWORK' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Globe size={14} /> Verified Network
          </button>

          <button
            type="button"
            onClick={() => setVisibility('COMMUNITY_ONLY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: visibility === 'COMMUNITY_ONLY' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              backgroundColor: visibility === 'COMMUNITY_ONLY' ? 'var(--accent-gold-bg)' : 'var(--bg-main)',
              color: visibility === 'COMMUNITY_ONLY' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Users size={14} /> Community Only
          </button>

          <button
            type="button"
            onClick={() => setVisibility('PRIVATE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: visibility === 'PRIVATE' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              backgroundColor: visibility === 'PRIVATE' ? 'var(--accent-gold-bg)' : 'var(--bg-main)',
              color: visibility === 'PRIVATE' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Lock size={14} /> Private
          </button>
        </div>

        {/* Dropdowns for Community or Private Recipient */}
        {visibility === 'COMMUNITY_ONLY' && (
          <select
            value={selectedCommunityId}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
            style={{
              marginTop: '4px',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {visibility === 'PRIVATE' && (
          <select
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
            style={{
              marginTop: '4px',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            {users.filter((u) => u.id !== currentUser.id).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}, {u.company})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Title Field (for Article or Link) */}
      {(postType === 'ARTICLE' || postType === 'LINK') && (
        <input
          type="text"
          placeholder={postType === 'ARTICLE' ? 'Article Title...' : 'Link Title / Commentary...'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            fontWeight: 600,
            outline: 'none'
          }}
        />
      )}

      {/* Link URL (for Link) */}
      {postType === 'LINK' && (
        <input
          type="url"
          placeholder="https://example.com/article"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none'
          }}
        />
      )}

      {/* Main Content Body */}
      <textarea
        placeholder={postType === 'ARTICLE' ? 'Write your article thoughts, observations, or founder lessons...' : 'What is on your mind?'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={postType === 'ARTICLE' ? 6 : 4}
        style={{
          padding: '12px 14px',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          outline: 'none',
          resize: 'vertical'
        }}
        required
      />

      {/* Visibility Preview Badge */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}
      >
        ✦ <strong>Visibility Preview:</strong> {getVisibilityPreview()}
      </div>

      {/* Form Submit Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !body.trim()}
          style={{
            padding: '8px 20px',
            backgroundColor: isSubmitting ? 'var(--border-medium)' : 'var(--accent-gold)',
            color: isSubmitting ? 'var(--text-muted)' : '#090B0F',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: 'none',
            cursor: isSubmitting || !body.trim() ? 'not-allowed' : 'pointer',
            opacity: isSubmitting || !body.trim() ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </form>
  );

  if (isGlobalModal) {
    return (
      <Modal
        isOpen={isCreatePostOpen}
        onClose={onCancel}
        title="Share an idea or insight"
        subtitle="Publish thoughts, articles, or relevant links to the verified network"
        maxWidth="640px"
      >
        {formContent}
      </Modal>
    );
  }

  return formContent;
};
