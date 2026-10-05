import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShieldCheck, CheckCircle, Shield, Building, UserCheck, FileCheck, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/Badge';

export const VerificationModal: React.FC = () => {
  const { isVerificationModalOpen, setIsVerificationModalOpen, currentUser } = useApp();

  const badgesExplanation = [
    {
      level: 'verified_member',
      name: 'Verified Member',
      proves: 'Work email domain ownership & active authentication (@company.com).',
      badge: <VerificationBadge level="verified_member" size="sm" />
    },
    {
      level: 'verified_professional',
      name: 'Verified Professional',
      proves: 'Work email domain + registered business entity existence + active professional role.',
      badge: <VerificationBadge level="verified_professional" size="sm" />
    },
    {
      level: 'verified_founder',
      name: 'Verified Founder',
      proves: 'Corporate domain + registered business entity + independent evidence of founder status (MCA Director filing / SEC / Cap table).',
      badge: <VerificationBadge level="verified_founder" size="sm" />
    },
    {
      level: 'verified_investor',
      name: 'Verified Investor',
      proves: 'Active VC firm domain + SEC / SEBI registration & verified portfolio filings.',
      badge: <VerificationBadge level="verified_investor" size="sm" />
    }
  ];

  const pillars = [
    {
      id: 'domain',
      title: 'Corporate Email & Domain',
      desc: 'Work email domain ownership & MX records (@company.com).',
      verified: currentUser.verificationPillars?.corporateDomainVerified ?? true,
      icon: <Shield size={18} style={{ color: 'var(--verified-green)' }} />
    },
    {
      id: 'entity',
      title: 'Company Registration (India MCA / SEC / UK)',
      desc: 'Official business registry filing & active status check.',
      verified: currentUser.verificationPillars?.entityVerified ?? true,
      icon: <Building size={18} style={{ color: 'var(--verified-green)' }} />
    },
    {
      id: 'founder',
      title: 'Founder / Officer Registry Check',
      desc: 'Director DIN index, SEC Edgar filings, or cap table cross-match.',
      verified: currentUser.verificationPillars?.founderStatusVerified ?? false,
      icon: <FileCheck size={18} style={{ color: 'var(--verified-green)' }} />
    },
    {
      id: 'invitation',
      title: 'Invitation Provenance Signal',
      desc: 'Trust signal from invitation by an existing Verified Founder.',
      verified: currentUser.verificationPillars?.invitationTrustSignal ?? true,
      icon: <UserCheck size={18} style={{ color: 'var(--accent-gold)' }} />
    }
  ];

  return (
    <Modal
      isOpen={isVerificationModalOpen}
      onClose={() => setIsVerificationModalOpen(false)}
      title="Progressive Verification Details"
      subtitle="Tell us who you are. Founders Hut verifies the evidence."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* User Current Level Banner */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--verified-green)',
                border: '1px solid var(--verified-green-border)'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {currentUser.role} · {currentUser.company}
              </div>
            </div>
          </div>

          <VerificationBadge level={currentUser.verificationLevel} size="md" />
        </div>

        {/* Manual Review Note if claim unresolved */}
        {currentUser.verificationPillars?.manualReviewPending && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--accent-gold-bg)',
              border: '1px solid var(--accent-gold-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}
          >
            <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Manual Review Queue Active</strong>
              <div style={{ marginTop: '2px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Automated registry checks are cross-matching your founder claim for <strong>{currentUser.company}</strong> against official director filings. No document uploads required. You maintain active access to Founders Hut.
              </div>
            </div>
          </div>
        )}

        {/* Verification Levels Explanation Table */}
        <div>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            What Each Verification Level Proves
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {badgesExplanation.map((item) => (
              <div
                key={item.level}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: currentUser.verificationLevel === item.level ? '1px solid var(--accent-gold-border)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.85rem'
                }}
              >
                <div>{item.badge}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'right', lineHeight: 1.35 }}>
                  {item.proves}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Pillars Breakdown */}
        <div>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Evidence Pipeline Checkpoints
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  {pillar.icon}
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {pillar.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {pillar.desc}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: pillar.verified ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {pillar.verified ? <CheckCircle size={14} /> : <Clock size={14} />}
                  {pillar.verified ? 'Verified' : 'Checking'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <Button variant="secondary" onClick={() => setIsVerificationModalOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
