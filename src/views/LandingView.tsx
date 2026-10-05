import React, { useRef } from 'react';
import { BrandLogo } from '../components/common/BrandLogo';
import { Button } from '../components/common/Button';
import { ShieldCheck, Search, UserCheck, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onStartOnboarding: () => void;
  onStartLogin?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStartOnboarding, onStartLogin }) => {
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Header */}
      <header
        style={{
          height: '72px',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        <BrandLogo size="md" />
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={onStartLogin || onStartOnboarding}>
            Sign In
          </Button>
          <Button variant="primary" onClick={onStartOnboarding}>
            Create your account
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <section
          style={{
            maxWidth: '800px',
            width: '100%',
            padding: '5rem 1.5rem 3rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.75rem'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-gold-bg)',
              border: '1px solid var(--accent-gold-border)',
              color: 'var(--accent-gold)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <ShieldCheck size={16} />
            <span>Verified Founder Network</span>
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              maxWidth: '720px'
            }}
          >
            Find the founder who's already solved your problem.
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: 0
            }}
          >
            Founders Hut matches you with verified founders based on what they've actually done — not just their job title.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <Button variant="primary" size="lg" onClick={onStartOnboarding}>
              Join Founders Hut <ArrowRight size={18} />
            </Button>
            <Button variant="secondary" size="lg" onClick={scrollToHowItWorks}>
              See how it works
            </Button>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          ref={howItWorksRef}
          style={{
            maxWidth: '1000px',
            width: '100%',
            padding: '4rem 1.5rem 6rem',
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '2rem'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              How Founders Hut Works
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Every interaction is built on verified identity and mutual trust.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-gold-bg)',
                  color: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>1. Verified People</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                We verify identity, role, and company so everyone knows they are talking to a real founder or executive with a real professional track record.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-gold-bg)',
                  color: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Search size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>2. Problem-First Match</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Describe what you are trying to solve — whether it's cross-border expansion, hiring, or fundraising — and see relevant founders who have done it.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-gold-bg)',
                  color: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UserCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>3. Trusted Introductions</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Never cold message. Ask a mutual connection to introduce you with a personalized note so connections feel warm, authentic, and high signal.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        Founders Hut &copy; {new Date().getFullYear()} — Signal over noise. Trust over vanity.
      </footer>
    </div>
  );
};
