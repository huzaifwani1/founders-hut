import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Textarea } from '../common/Input';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useApp } from '../../context/AppContext';
import { Send, UserPlus } from 'lucide-react';

export const OfferHelpModal: React.FC = () => {
  const { selectedRequestForHelp, setSelectedRequestForHelp, offerHelpOnRequest, users } = useApp();
  const [offerNote, setOfferNote] = useState('');
  const [actionType, setActionType] = useState<'direct_help' | 'make_intro'>('direct_help');
  const [suggestedUser, setSuggestedUser] = useState<string>('');

  if (!selectedRequestForHelp) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerNote.trim()) return;

    let finalNote = offerNote;
    if (actionType === 'make_intro' && suggestedUser) {
      finalNote = `Suggested Connection: ${suggestedUser} — Note: ${offerNote}`;
    }

    offerHelpOnRequest(selectedRequestForHelp.id, finalNote);
    setOfferNote('');
    setSuggestedUser('');
  };

  return (
    <Modal
      isOpen={!!selectedRequestForHelp}
      onClose={() => setSelectedRequestForHelp(null)}
      title="Offer help"
      subtitle={`Connecting with ${selectedRequestForHelp.author.name} (${selectedRequestForHelp.author.company})`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Request Context Card */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Avatar
              src={selectedRequestForHelp.author.avatar}
              name={selectedRequestForHelp.author.name}
              size="sm"
            />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedRequestForHelp.author.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {selectedRequestForHelp.author.role} · {selectedRequestForHelp.author.company}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', margin: 0 }}>
            "{selectedRequestForHelp.title}"
          </p>
        </div>

        {/* Response Action Toggle */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
            How would you like to help?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setActionType('direct_help')}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: actionType === 'direct_help' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                backgroundColor: actionType === 'direct_help' ? 'var(--accent-gold-bg)' : 'var(--bg-surface-elevated)',
                color: actionType === 'direct_help' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Send size={14} />
              I can help directly
            </button>
            <button
              type="button"
              onClick={() => setActionType('make_intro')}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: actionType === 'make_intro' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                backgroundColor: actionType === 'make_intro' ? 'var(--accent-gold-bg)' : 'var(--bg-surface-elevated)',
                color: actionType === 'make_intro' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={14} />
              Introduce someone
            </button>
          </div>
        </div>

        {actionType === 'make_intro' && (
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
              Select someone to introduce
            </label>
            <select
              value={suggestedUser}
              onChange={(e) => setSuggestedUser(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="">-- Select a member --</option>
              {users.map((u) => (
                <option key={u.id} value={`${u.name} (${u.role}, ${u.company})`}>
                  {u.name} — {u.role} at {u.company}
                </option>
              ))}
            </select>
          </div>
        )}

        <Textarea
          label={actionType === 'direct_help' ? 'Your message' : 'Why this connection helps'}
          placeholder={
            actionType === 'direct_help'
              ? 'Share a brief note on how you can help...'
              : 'Add a personal note on why this connection is relevant...'
          }
          value={offerNote}
          onChange={(e) => setOfferNote(e.target.value)}
          required
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" type="button" onClick={() => setSelectedRequestForHelp(null)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<Send size={14} />}>
            {actionType === 'direct_help' ? 'Send message' : 'Make introduction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
