import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const IntroRequestModal: React.FC = () => {
  const {
    isIntroModalOpen,
    setIsIntroModalOpen,
    introTargetUser,
    introFacilitatorUser,
    requestIntroduction,
    currentUser,
    introductions
  } = useApp();

  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (introTargetUser && introFacilitatorUser) {
      setReason(
        `Hi ${introFacilitatorUser.name.split(' ')[0]}, I'd like to connect with ${introTargetUser.name.split(' ')[0]} regarding their verified experience in ${introTargetUser.company}.`
      );
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [introTargetUser, introFacilitatorUser, isIntroModalOpen]);

  if (!isIntroModalOpen || !introTargetUser || !introFacilitatorUser) {
    return null;
  }

  // Check if duplicate active request exists
  const existingActiveIntro = introductions.find(
    (i) =>
      i.status === 'REQUESTED' &&
      i.fromUser.id === currentUser.id &&
      i.toUser.id === introTargetUser.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const res = await requestIntroduction(introTargetUser, reason.trim(), introFacilitatorUser);
    if (res.isDuplicate) {
      setErrorMsg(`An active introduction request to ${introTargetUser.name} is already pending.`);
    } else {
      setSuccessMsg(`Introduction request sent to ${introFacilitatorUser.name.split(' ')[0]}!`);
      setTimeout(() => {
        setIsIntroModalOpen(false);
      }, 1200);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={() => setIsIntroModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          animation: 'modalFadeIn 150ms ease-out'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <ShieldCheck size={15} /> Trusted Warm Introduction
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
              Request Introduction to {introTargetUser.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsIntroModalOpen(false)}
            style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>

        {/* 3-Way Pathway Nodes */}
        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          {/* Requester (You) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
            <Avatar name={currentUser.name} src={currentUser.avatar} size="md" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
              You ({currentUser.name.split(' ')[0]})
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Requester</span>
          </div>

          <ArrowRight size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />

          {/* Facilitator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
            <Avatar name={introFacilitatorUser.name} src={introFacilitatorUser.avatar} size="md" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-gold)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
              {introFacilitatorUser.name.split(' ')[0]}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)' }}>Facilitator</span>
          </div>

          <ArrowRight size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />

          {/* Target User Node */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
            <Avatar name={introTargetUser.name} src={introTargetUser.avatar} size="md" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
              {introTargetUser.name.split(' ')[0]}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{introTargetUser.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* Success or Existing Active Request Notice */}
        {successMsg && (
          <div style={{ backgroundColor: 'var(--green-tint)', border: '1px solid var(--verified-green)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--verified-green)', fontSize: '0.85rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {existingActiveIntro ? (
          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>
              <AlertCircle size={16} /> Introduction Request Pending
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              You have already requested an introduction to <strong>{introTargetUser.name}</strong> via <strong>{existingActiveIntro.facilitator.name}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>{errorMsg}</div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                What problem are you trying to solve? <span style={{ color: 'var(--accent-gold)' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
                placeholder="1–2 sentences describing your specific business challenge..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Why do you think {introTargetUser.name.split(' ')[0]} can help? (Optional)
              </label>
              <input
                type="text"
                placeholder={`e.g. Their experience scaling ${introTargetUser.company}`}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsIntroModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Send Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
