import React from 'react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { VerificationBadge, Tag } from '../common/Badge';
import { Button } from '../common/Button';
import { MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PathwayVisualizer } from '../common/PathwayVisualizer';

export const ProfileModal: React.FC = () => {
  const { selectedProfile, setSelectedProfile, startDirectMessage, openIntroRequest, currentUser } = useApp();

  if (!selectedProfile) return null;

  const isSelf = currentUser.id === selectedProfile.id;

  return (
    <Modal
      isOpen={!!selectedProfile}
      onClose={() => setSelectedProfile(null)}
      title=""
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header Profile Summary */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <Avatar
            name={selectedProfile.name}
            src={selectedProfile.avatar}
            size="xl"
            verificationLevel={selectedProfile.verificationLevel}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {selectedProfile.name}
              </h2>
              <VerificationBadge level={selectedProfile.verificationLevel} size="md" />
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 500 }}>
              {selectedProfile.role} · {selectedProfile.company}
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>📍 {selectedProfile.location}</span>
              {selectedProfile.yearsBuilding && <span>⚡ {selectedProfile.yearsBuilding} years building</span>}
              {selectedProfile.companyStage && <span>🚀 {selectedProfile.companyStage}</span>}
            </div>
          </div>
        </div>

        {/* Can Help With & Looking For Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle size={14} /> Can help with
            </h5>
            <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {selectedProfile.canHelpWith.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertCircle size={14} /> Looking for
            </h5>
            <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {selectedProfile.lookingFor.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mutual Connection Pathway Graph */}
        {currentUser.id !== selectedProfile.id && (
          <PathwayVisualizer
            currentUser={currentUser}
            targetUser={selectedProfile}
            detailedGraph={true}
            onRequestIntro={() => {
              const target = selectedProfile;
              const facilitator = selectedProfile.pathway?.facilitator;
              setSelectedProfile(null);
              openIntroRequest(target, facilitator);
            }}
          />
        )}

        {/* Below the Fold: Bio & Track Record */}
        {selectedProfile.bio && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              About
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {selectedProfile.bio}
            </p>
          </div>
        )}

        {selectedProfile.experience && selectedProfile.experience.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Track Record
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {selectedProfile.experience.map((exp, idx) => (
                <div key={idx} style={{ padding: '8px 12px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span>{exp.title} · {exp.company}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProfile.skills && selectedProfile.skills.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {selectedProfile.skills.map((skill, idx) => (
              <Tag key={idx} variant="default" size="sm">{skill}</Tag>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setSelectedProfile(null)}>
            Close
          </Button>

          {!isSelf && (
            <Button
              variant="secondary"
              onClick={() => {
                const target = selectedProfile;
                const facilitator = selectedProfile.pathway?.facilitator;
                setSelectedProfile(null);
                openIntroRequest(target, facilitator);
              }}
            >
              Request Introduction
            </Button>
          )}

          <Button
            variant="primary"
            icon={<MessageSquare size={14} />}
            onClick={() => {
              const target = selectedProfile;
              setSelectedProfile(null);
              startDirectMessage(target);
            }}
          >
            Start conversation
          </Button>
        </div>
      </div>
    </Modal>
  );
};
