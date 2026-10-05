import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Home, Users, FileText, MessageSquare, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavTab } from '../../context/AppContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { activeTab, setActiveTab, conversations } = useApp();

  const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const mobileTabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'people', label: 'People', icon: <Users size={20} /> },
    { id: 'requests', label: 'Requests', icon: <FileText size={20} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} />, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
      {/* Desktop Sidebar */}
      <div className="fh-desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 90,
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: 'var(--bg-surface)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setMobileNavOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '60px' }} className="fh-main-wrapper">
        <Header onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)} />
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <div className="fh-container">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fh-mobile-bottom-bar">
        {mobileTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minHeight: '48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {tab.icon}
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 }}>
                {tab.label}
              </span>
              {tab.badge && tab.badge > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: 'calc(50% - 14px)',
                    width: '6px',
                    height: '6px',
                    backgroundColor: 'var(--accent-gold)',
                    borderRadius: '50%'
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <style>{`
        .fh-mobile-bottom-bar {
          display: none;
        }

        @media (max-width: 768px) {
          .fh-desktop-sidebar {
            display: none !important;
          }
          .fh-mobile-menu-btn {
            display: flex !important;
          }
          .fh-main-wrapper {
            padding-bottom: 60px !important;
          }
          .fh-mobile-bottom-bar {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 56px;
            backgroundColor: var(--bg-surface);
            border-top: 1px solid var(--border-subtle);
            zIndex: 50;
            align-items: center;
            justify-content: space-around;
            padding: 0 4px;
          }
        }
      `}</style>
    </div>
  );
};
