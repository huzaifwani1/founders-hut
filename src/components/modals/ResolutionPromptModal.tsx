import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, ShieldCheck, Lock, Globe, Users as UsersIcon } from 'lucide-react';
import type { OutcomeType, OutcomeCategory, HelpType, ResolutionVisibility } from '../../types';

export const ResolutionPromptModal: React.FC = () => {
  const {
    currentUser,
    isResolutionModalOpen,
    setIsResolutionModalOpen,
    selectedRequestForResolution,
    setSelectedRequestForResolution,
    selectedHelperForResolution,
    setSelectedHelperForResolution,
    createResolution
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [outcomeType, setOutcomeType] = useState<OutcomeType>('SOLVED');
  const [outcomeCategory, setOutcomeCategory] = useState<OutcomeCategory>('ACTIONABLE_ADVICE');
  const [helpType, setHelpType] = useState<HelpType>('OPERATIONAL_EXPERIENCE');
  const [askerAssessment, setAskerAssessment] = useState('');
  const [summary, setSummary] = useState('');
  const [visibility, setVisibility] = useState<ResolutionVisibility>('VERIFIED_NETWORK');

  if (!isResolutionModalOpen || !selectedRequestForResolution || !selectedHelperForResolution) {
    return null;
  }

  const handleClose = () => {
    setIsResolutionModalOpen(false);
    setSelectedRequestForResolution(null);
    setSelectedHelperForResolution(null);
    setStep(1);
    setAskerAssessment('');
    setSummary('');
  };

  const handleOutcomeSelect = (selectedOutcome: OutcomeType) => {
    setOutcomeType(selectedOutcome);
    if (selectedOutcome === 'NOT_HELPFUL') {
      // Direct submit for not helpful without requiring helper narrative
      createResolution({
        requestId: selectedRequestForResolution.id,
        asker: currentUser,
        helper: selectedHelperForResolution,
        outcomeType: 'NOT_HELPFUL',
        helpType: 'OTHER',
        visibility: 'PRIVATE'
      });
      handleClose();
    } else {
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createResolution({
      requestId: selectedRequestForResolution.id,
      asker: currentUser,
      helper: selectedHelperForResolution,
      outcomeType,
      outcomeCategory,
      helpType,
      askerAssessment: askerAssessment || summary,
      summary: summary || askerAssessment,
      visibility
    });
    handleClose();
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
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '540px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Problems Solved · Trust Layer
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
              Did {selectedHelperForResolution.name} help with this?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              "{selectedRequestForResolution.title}"
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Outcome Selection */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
              Select the status of your interaction with {selectedHelperForResolution.name}:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleOutcomeSelect('SOLVED')}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--accent-gold-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-gold)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle2 size={18} /> Yes, Solved
              </button>

              <button
                type="button"
                onClick={() => handleOutcomeSelect('PARTIALLY_SOLVED')}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Partially Solved
              </button>

              <button
                type="button"
                onClick={() => handleOutcomeSelect('STILL_IN_PROGRESS')}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Still Working
              </button>

              <button
                type="button"
                onClick={() => handleOutcomeSelect('NOT_HELPFUL')}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Not Helpful
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Outcome Categorization & Privacy */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                What did the help lead to? (Outcome Category)
              </label>
              <select
                value={outcomeCategory}
                onChange={(e) => setOutcomeCategory(e.target.value as OutcomeCategory)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="ACTIONABLE_ADVICE">Actionable Strategic Advice</option>
                <option value="FOUND_RIGHT_PERSON">Found Right Key Person</option>
                <option value="BUSINESS_DECISION">Critical Business Decision</option>
                <option value="DEAL">Deal / Contract Closed</option>
                <option value="HIRE">Senior Executive Hire</option>
                <option value="PARTNERSHIP">Strategic Partnership</option>
                <option value="VENDOR">Vendor / Infrastructure Selected</option>
                <option value="AVOIDED_MISTAKE">Avoided Costly Mistake</option>
                <option value="OTHER">Other Outcome</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Help Type Provided
              </label>
              <select
                value={helpType}
                onChange={(e) => setHelpType(e.target.value as HelpType)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="OPERATIONAL_EXPERIENCE">Operational Experience</option>
                <option value="STRATEGIC_ADVICE">Strategic Advice</option>
                <option value="WARM_INTRODUCTION">Warm Introduction</option>
                <option value="VENDOR_CONNECTION">Vendor Connection</option>
                <option value="PARTNER_CONNECTION">Partner Connection</option>
                <option value="HIRING_HELP">Hiring Support</option>
                <option value="DOCUMENT_REVIEW">Document Review</option>
                <option value="OTHER">Other Help</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Narrative Proof Summary (Restrained)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Guided freezone entity registration and distribution setup in Dubai."
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setAskerAssessment(e.target.value);
                }}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Visibility Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Visibility Control
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setVisibility('VERIFIED_NETWORK')}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: visibility === 'VERIFIED_NETWORK' ? 'var(--gold-tint)' : 'var(--bg-main)',
                    border: visibility === 'VERIFIED_NETWORK' ? '1px solid var(--accent-gold-border)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: visibility === 'VERIFIED_NETWORK' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Globe size={13} /> Network
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('PARTICIPANTS_ONLY')}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: visibility === 'PARTICIPANTS_ONLY' ? 'var(--gold-tint)' : 'var(--bg-main)',
                    border: visibility === 'PARTICIPANTS_ONLY' ? '1px solid var(--accent-gold-border)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: visibility === 'PARTICIPANTS_ONLY' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <UsersIcon size={13} /> Participants
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: visibility === 'PRIVATE' ? 'var(--gold-tint)' : 'var(--bg-main)',
                    border: visibility === 'PRIVATE' ? '1px solid var(--accent-gold-border)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: visibility === 'PRIVATE' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Lock size={13} /> Private
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ← Back
              </button>

              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'var(--accent-gold)',
                  color: 'var(--bg-main)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={16} /> Submit for Helper Confirmation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
