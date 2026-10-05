import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BrandLogo } from '../components/common/BrandLogo';
import { Sparkles, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ActivationViewProps {
  onComplete: () => void;
}

export const ActivationView: React.FC<ActivationViewProps> = ({ onComplete }) => {
  const { currentUser, setCurrentUser } = useApp();

  const HELP_OPTIONS = [
    'Hiring & Executive Talent',
    'Fundraising & Term Sheets',
    'Distribution & Retail Slotting',
    'Manufacturing & Supply Chain',
    'Marketing & D2C Growth',
    'Technology & System Architecture',
    'International Expansion (GCC/US)',
    'Finance & Venture Debt',
    'Legal & Cross-Border Entity Setup',
    'Operations & Cold-Chain Logistics'
  ];

  const LOOKING_FOR_OPTIONS = [
    'Institutional Investors / Angel Partners',
    'Co-founders & Technical Leads',
    'Enterprise Customers & Design Partners',
    'Suppliers & Manufacturing Partners',
    'Hiring Senior VP Leadership',
    'Strategic Retail Partnerships',
    'Mentors & Board Advisors',
    'Market Expansion Playbooks'
  ];

  const STAGE_OPTIONS = ['Bootstrapped', 'Seed', 'Series A', 'Series B+', 'Growth', 'Public'];

  const [selectedCanHelp, setSelectedCanHelp] = useState<string[]>(
    currentUser.canHelpWith || ['Hiring & Executive Talent', 'Fundraising & Term Sheets']
  );
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(
    currentUser.lookingFor || ['Enterprise Customers & Design Partners']
  );
  const [yearsBuilding, setYearsBuilding] = useState<number>(7);
  const [selectedStage, setSelectedStage] = useState<string>(currentUser.companyStage || 'Series A');

  const toggleHelp = (opt: string) => {
    setSelectedCanHelp((prev) =>
      prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
    );
  };

  const toggleLookingFor = (opt: string) => {
    setSelectedLookingFor((prev) =>
      prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser((prev) => ({
      ...prev,
      canHelpWith: selectedCanHelp,
      lookingFor: selectedLookingFor,
      yearsBuilding,
      companyStage: selectedStage
    }));
    onComplete();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem'
      }}
    >
      <div style={{ maxWidth: '680px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Banner */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <BrandLogo size="lg" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.5rem' }}>
            <Sparkles size={16} /> Activate Your Founder Network
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome, {currentUser.name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '540px', lineHeight: 1.5 }}>
            Define your operational capabilities and current strategic priorities. This powers Founders Hut's intent-based discovery and match reasoning.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: What I Can Help With */}
          <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--verified-green)' }}><CheckCircle2 size={16} /> What I Can Help With (Select Capabilities)</span>}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {HELP_OPTIONS.map((opt) => {
                const active = selectedCanHelp.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleHelp(opt)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: active ? '1px solid var(--verified-green)' : '1px solid var(--border-subtle)',
                      backgroundColor: active ? 'var(--verified-green-bg)' : 'var(--bg-surface-elevated)',
                      color: active ? 'var(--verified-green)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {active ? '✓ ' : '+ '}{opt}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Section 2: What I'm Looking For */}
          <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)' }}><AlertCircle size={16} /> What I'm Currently Looking For</span>}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {LOOKING_FOR_OPTIONS.map((opt) => {
                const active = selectedLookingFor.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleLookingFor(opt)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: active ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      backgroundColor: active ? 'var(--accent-gold-bg)' : 'var(--bg-surface-elevated)',
                      color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {active ? '✓ ' : '+ '}{opt}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Section 3: Founder Context */}
          <Card title="Founder Context & Track Record">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                  Company Growth Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
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
                  {STAGE_OPTIONS.map((stg) => (
                    <option key={stg} value={stg}>{stg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                  Years Experience Building
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={yearsBuilding}
                  onChange={(e) => setYearsBuilding(parseInt(e.target.value, 10) || 5)}
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
                />
              </div>
            </div>
          </Card>

          <Button variant="primary" type="submit" fullWidth size="lg">
            Complete Network Activation <ArrowRight size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};
