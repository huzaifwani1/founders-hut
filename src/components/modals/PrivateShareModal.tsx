import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

export const PrivateShareModal: React.FC = () => {
  const { selectedPostForPrivateShare, setSelectedPostForPrivateShare, users, currentUser, sharePostPrivately } = useApp();
  const [recipientId, setRecipientId] = useState(users.find((u) => u.id !== currentUser.id)?.id || '');
  const [message, setMessage] = useState('');

  if (!selectedPostForPrivateShare) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId) return;
    sharePostPrivately(selectedPostForPrivateShare.id, recipientId, message.trim());
  };

  return (
    <Modal
      isOpen={!!selectedPostForPrivateShare}
      onClose={() => setSelectedPostForPrivateShare(null)}
      title="Share Post Privately"
      subtitle="Send this post directly to a verified member. This content remains private between you."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Post Preview Box */}
        <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
            {selectedPostForPrivateShare.author.name} · {selectedPostForPrivateShare.author.role}
          </div>
          {selectedPostForPrivateShare.title && (
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedPostForPrivateShare.title}
            </div>
          )}
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {selectedPostForPrivateShare.body}
          </div>
        </div>

        {/* Recipient Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Send to Member
          </label>
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          >
            {users.filter((u) => u.id !== currentUser.id).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}, {u.company})
              </option>
            ))}
          </select>
        </div>

        {/* Optional Note */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Optional Note
          </label>
          <input
            type="text"
            placeholder="e.g. Thought you would find this tactical lesson relevant..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setSelectedPostForPrivateShare(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 20px',
              backgroundColor: 'var(--accent-gold)',
              color: '#090B0F',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Send Privately
          </button>
        </div>
      </form>
    </Modal>
  );
};
