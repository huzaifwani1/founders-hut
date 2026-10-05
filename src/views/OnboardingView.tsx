import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { BrandLogo } from '../components/common/BrandLogo';
import { ArrowRight, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { ApiClient } from '../services/api';

interface OnboardingViewProps {
  onOnboardingComplete: (user: any) => void;
  onBackToLanding?: () => void;
  initialMode?: 'register' | 'login';
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onOnboardingComplete,
  onBackToLanding,
  initialMode = 'register'
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');

  // Form Fields
  const [name, setName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [role, setRole] = useState('Founder');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');

  const roles = [
    'Founder',
    'Co-Founder',
    'CEO',
    'CTO',
    'CFO',
    'COO',
    'Managing Director',
    'Executive',
    'Investor'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEmail.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'register' && (!name.trim() || !company.trim())) {
      setError('Please fill in all required registration fields.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      if (mode === 'register') {
        const result = await ApiClient.register({
          email: workEmail.trim(),
          password: password.trim(),
          name: name.trim(),
          role,
          company: company.trim()
        });

        if (result.user) {
          onOnboardingComplete(result.user);
        } else {
          setInfoMessage(result.message || 'Account registration initiated. Please log in.');
          setMode('login');
        }
      } else {
        const user = await ApiClient.login(workEmail.trim(), password.trim());
        onOnboardingComplete(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
        padding: '2rem 1rem'
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <BrandLogo size="lg" />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--accent-gold)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: '0.25rem'
            }}
          >
            <Sparkles size={15} /> Join the founder network
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {mode === 'register' ? 'Tell us who you are. Founders Hut verifies the evidence.' : 'Welcome back to Founders Hut.'}
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '440px', lineHeight: 1.45 }}>
            {mode === 'register'
              ? 'Join the private network for verified founders, CEOs, and executive leaders.'
              : 'Log in with your corporate credentials to access your verified network.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setInfoMessage(''); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              backgroundColor: mode === 'register' ? 'var(--accent-gold)' : 'transparent',
              color: mode === 'register' ? '#000' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.88rem'
            }}
          >
            <UserPlus size={16} /> Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setInfoMessage(''); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              backgroundColor: mode === 'login' ? 'var(--accent-gold)' : 'transparent',
              color: mode === 'login' ? '#000' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.88rem'
            }}
          >
            <LogIn size={16} /> Sign In
          </button>
        </div>

        <Card padding="lg">
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                marginBottom: '1rem'
              }}
            >
              {error}
            </div>
          )}

          {infoMessage && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60A5FA',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                marginBottom: '1rem'
              }}
            >
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {mode === 'register' && (
              <Input
                label="Full Name *"
                type="text"
                placeholder="e.g. Vikramaditya Oberoi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              label="Corporate / Work Email *"
              type="email"
              placeholder="e.g. vikram@aethermetrics.dev"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              required
            />

            <Input
              label="Password *"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {mode === 'register' && (
              <>
                <Input
                  label="Company / Enterprise Name *"
                  type="text"
                  placeholder="e.g. Aether Metrics"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                    Your Professional Role *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {roles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid',
                          borderColor: role === r ? 'var(--accent-gold)' : 'var(--border-subtle)',
                          backgroundColor: role === r ? 'var(--accent-gold-bg)' : 'transparent',
                          color: role === r ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: role === r ? 600 : 400,
                          cursor: 'pointer'
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button variant="primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
              {loading ? (
                'Processing...'
              ) : mode === 'register' ? (
                <>
                  Create Executive Account <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Sign In <LogIn size={16} />
                </>
              )}
            </Button>
          </form>

          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Back to main page
            </button>
          )}
        </Card>
      </div>
    </div>
  );
};
