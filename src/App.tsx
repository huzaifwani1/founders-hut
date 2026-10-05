import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import { LandingView } from './views/LandingView';
import { OnboardingView } from './views/OnboardingView';
import { ActivationView } from './views/ActivationView';
import { HomeView } from './views/HomeView';
import { DiscoverView } from './views/DiscoverView';
import { RequestsView } from './views/RequestsView';
import { NetworkView } from './views/NetworkView';
import { ProfileView } from './views/ProfileView';
import { HelpDeskView } from './views/HelpDeskView';
import { CommunitiesView } from './views/CommunitiesView';
import { InvestorsView } from './views/InvestorsView';
import { MessagesView } from './views/MessagesView';

import { CreateRequestModal } from './components/modals/CreateRequestModal';
import { VerificationModal } from './components/modals/VerificationModal';
import { OfferHelpModal } from './components/modals/OfferHelpModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { PostComposer } from './components/posts/PostComposer';
import { CreateCommunityModal } from './components/modals/CreateCommunityModal';
import { PrivateShareModal } from './components/modals/PrivateShareModal';
import { ResolutionPromptModal } from './components/modals/ResolutionPromptModal';
import { IntroRequestModal } from './components/modals/IntroRequestModal';

import './styles/index.css';

const MainContent: React.FC = () => {
  const { activeTab, isAuthenticated, isLoadingSession, refreshAppData } = useApp();
  const [viewState, setViewState] = useState<'landing' | 'onboarding' | 'login' | 'activation' | 'app'>('landing');

  React.useEffect(() => {
    if (!isAuthenticated) {
      setViewState('landing');
    }
  }, [isAuthenticated]);

  if (isLoadingSession) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold)' }}>FOUNDERS HUT</div>
          <div style={{ fontSize: '0.85rem' }}>Restoring verified session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && viewState !== 'activation') {
    if (viewState === 'onboarding') {
      return (
        <OnboardingView
          initialMode="register"
          onOnboardingComplete={async () => {
            await refreshAppData();
            setViewState('app');
          }}
          onBackToLanding={() => setViewState('landing')}
        />
      );
    }

    if (viewState === 'login') {
      return (
        <OnboardingView
          initialMode="login"
          onOnboardingComplete={async () => {
            await refreshAppData();
            setViewState('app');
          }}
          onBackToLanding={() => setViewState('landing')}
        />
      );
    }

    return (
      <LandingView
        onStartOnboarding={() => setViewState('onboarding')}
        onStartLogin={() => setViewState('login')}
      />
    );
  }

  if (viewState === 'activation') {
    return <ActivationView onComplete={() => setViewState('app')} />;
  }

  return (
    <MainLayout>
      {activeTab === 'home' && <HomeView />}
      {activeTab === 'help' && <HelpDeskView />}
      {(activeTab === 'discover' || activeTab === 'people') && <DiscoverView />}
      {activeTab === 'communities' && <CommunitiesView />}
      {activeTab === 'requests' && <RequestsView />}
      {activeTab === 'investors' && <InvestorsView />}
      {activeTab === 'network' && <NetworkView />}
      {activeTab === 'messages' && <MessagesView />}
      {activeTab === 'profile' && <ProfileView />}

      {/* Global Modals */}
      <CreateRequestModal />
      <VerificationModal />
      <OfferHelpModal />
      <ProfileModal />
      <PostComposer />
      <CreateCommunityModal />
      <PrivateShareModal />
      <ResolutionPromptModal />
      <IntroRequestModal />
    </MainLayout>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
