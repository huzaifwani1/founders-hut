import React from 'react';
import { Home, Users, FileText, MessageSquare, Moon, Sun, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavTab } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/Badge';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    setIsVerificationModalOpen,
    theme,
    toggleTheme,
    conversations
  } = useApp();

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'people', label: 'People', icon: <Users size={18} /> },
    { id: 'requests', label: 'Requests', icon: <FileText size={18} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} />, badge: totalUnread },
    { id: 'profile', label: 'Profile', icon: <User size={18} /> }
  ];

  const isTabActive = (id: NavTab) => {
    if (id === 'people') return activeTab === 'people' || activeTab === 'discover' || activeTab === 'help';
    return activeTab === id;
  };

  return (
    <aside
      style={{
        width: '240px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        flexShrink: 0,
        zIndex: 40
      }}
    >
      {/* Brand Logo */}
      <div style={{ padding: '0 0.5rem 1.5rem 0.5rem' }}>
        <BrandLogo size="md" />
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = isTabActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
                backgroundColor: active ? 'rgba(216, 180, 95, 0.05)' : 'transparent',
                fontWeight: active ? 600 : 400,
                borderLeft: active ? '2px solid var(--accent-gold)' : '2px solid transparent',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: active ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '0.88rem', letterSpacing: '0.01em' }}>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span
                  style={{
                    backgroundColor: 'var(--accent-gold)',
                    color: '#090B0F',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Profile + Theme */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
        {/* User Card — clicking opens Profile */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 6px 4px 6px' }}>
          <button
            data-testid="sidebar-profile-btn"
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
          >
            <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {currentUser.role}
              </div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
              title="View trust details"
            >
              <VerificationBadge level={currentUser.verificationLevel} size="sm" />
            </button>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'none',
                border: 'none'
              }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
