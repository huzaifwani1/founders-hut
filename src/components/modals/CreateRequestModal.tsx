import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input, Textarea } from '../common/Input';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';

export const CreateRequestModal: React.FC = () => {
  const { isCreateRequestOpen, setIsCreateRequestOpen, addRequest } = useApp();

  const [needCategory, setNeedCategory] = useState<'Hiring & Talent' | 'Fundraising & Advisory' | 'Market Expansion' | 'Vendor & Tech Stack' | 'Strategic Advice' | 'General Intro'>('Market Expansion');
  const [title, setTitle] = useState('');
  const [needDescription, setNeedDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC_TO_VERIFIED_NETWORK' | 'CONNECTIONS_ONLY' | 'PRIVATE'>('PUBLIC_TO_VERIFIED_NETWORK');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !needDescription.trim()) return;

    addRequest({
      needCategory,
      title,
      needDescription,
      context: '',
      industry: 'Cross-Industry',
      location: 'Remote',
      desiredConnection: '',
      visibility
    });

    setTitle('');
    setNeedDescription('');
  };

  return (
    <Modal
      isOpen={isCreateRequestOpen}
      onClose={() => setIsCreateRequestOpen(false)}
      title="Share a challenge"
      subtitle="Connect with verified founders who have solved similar problems"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
            1. Category *
          </label>
          <select
            value={needCategory}
            onChange={(e) => setNeedCategory(e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          >
            <option value="Market Expansion">Expansion & Distribution</option>
            <option value="Fundraising & Advisory">Fundraising & Capital</option>
            <option value="Hiring & Talent">Hiring & Co-founders</option>
            <option value="Vendor & Tech Stack">Technology & Vendors</option>
            <option value="Strategic Advice">Strategic Advice</option>
            <option value="General Intro">General Introduction</option>
          </select>
        </div>

        <Input
          label="2. What do you need help with? *"
          placeholder="e.g. Looking for a founder who has expanded D2C retail distribution"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="3. Problem details *"
          placeholder="Describe what you are trying to solve and what background or help would be ideal..."
          value={needDescription}
          onChange={(e) => setNeedDescription(e.target.value)}
          required
        />

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
            4. Request Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          >
            <option value="PUBLIC_TO_VERIFIED_NETWORK">Verified Founders</option>
            <option value="CONNECTIONS_ONLY">Direct Connections Only</option>
            <option value="PRIVATE">Private (Author Only)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="secondary" type="button" onClick={() => setIsCreateRequestOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Ask the network
          </Button>
        </div>
      </form>
    </Modal>
  );
};
