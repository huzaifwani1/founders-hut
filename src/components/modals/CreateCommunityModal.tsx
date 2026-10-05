import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

export const CreateCommunityModal: React.FC = () => {
  const { isCreateCommunityOpen, setIsCreateCommunityOpen, createCommunity } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SECTOR');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    createCommunity(name.trim(), description.trim(), category, isPrivate);
    setName('');
    setDescription('');
  };

  return (
    <Modal
      isOpen={isCreateCommunityOpen}
      onClose={() => setIsCreateCommunityOpen(false)}
      title="Create a Founder Community"
      subtitle="Establish a focused room for verified member discussions and knowledge sharing."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Community Name
          </label>
          <input
            type="text"
            placeholder="e.g. AI & Autonomous Systems, D2C Founders Guild"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Description
          </label>
          <textarea
            placeholder="Describe the focus and purpose of this circle..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            <option value="SECTOR">Sector / Industry</option>
            <option value="STAGE">Company Stage</option>
            <option value="TOPIC">Tactical Topic</option>
            <option value="REGION">Geography / Regional</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="communityPrivate"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="communityPrivate" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            Private community (Members must join to view posts)
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setIsCreateCommunityOpen(false)}
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
            Create Community
          </button>
        </div>
      </form>
    </Modal>
  );
};
