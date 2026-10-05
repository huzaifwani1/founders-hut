import React, { useState } from 'react';
import { Search, Bell, Menu, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onToggleMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav }) => {
  const {
    activeTab,
    setActiveTab,
    setDiscoverSearch,
    notifications,
    markNotificationRead,
    confirmResolution
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const titles: Record<string, { title: string; subtitle: string }> = {
    home: { title: 'Home', subtitle: '' },
    help: { title: 'Find help', subtitle: '' },
    people: { title: 'People', subtitle: 'Find the right person.' },
    discover: { title: 'People', subtitle: 'Find the right person.' },
    communities: { title: 'Communities', subtitle: 'Private founder rooms.' },
    requests: { title: 'Requests', subtitle: 'Business problems worth solving.' },
    investors: { title: 'Investors', subtitle: 'Verified investor directory.' },
    network: { title: 'Network', subtitle: '' },
    messages: { title: 'Messages', subtitle: 'Private conversations.' },
    profile: { title: 'Profile', subtitle: '' }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscoverSearch(localSearch);
    setActiveTab('people');
  };

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-main)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      {/* Title & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleMobileNav}
          className="fh-mobile-menu-btn"
          style={{
            display: 'none',
            padding: '8px',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {titles[activeTab]?.title || 'Founders Hut'}
          </h1>
          {titles[activeTab]?.subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {titles[activeTab]?.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Search & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search founders, problems, skills..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 36px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </form>

        {/* Notifications Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            data-testid="notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              padding: '8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '7px',
                  height: '7px',
                  backgroundColor: 'var(--accent-gold)',
                  borderRadius: '50%'
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '1rem',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notifications</span>
                <span
                  onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
                  style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', cursor: 'pointer' }}
                >
                  Mark all read
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      data-testid="notification-item"
                      onClick={() => {
                        markNotificationRead(notif.id);
                        setShowNotifications(false);
                        if (notif.type === 'INTRO_REQUESTED' || notif.type === 'INTRO_ACCEPTED') {
                          setActiveTab('messages');
                        } else if (notif.type === 'REQUEST_MATCH' || notif.type === 'RESOLUTION_PROMPT') {
                          setActiveTab('requests');
                        }
                      }}
                      style={{
                        display: 'flex',
                        gap: '0.65rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        opacity: notif.isRead ? 0.6 : 1,
                        cursor: 'pointer'
                      }}
                    >
                      <ShieldCheck size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{notif.detail}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{notif.createdAt}</div>

                        {notif.type === 'RESOLUTION_PROMPT' && notif.targetId && (
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '6px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmResolution(notif.targetId!, true);
                                markNotificationRead(notif.id);
                              }}
                              style={{
                                padding: '3px 8px',
                                backgroundColor: 'var(--accent-gold)',
                                color: '#000000',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmResolution(notif.targetId!, false);
                                markNotificationRead(notif.id);
                              }}
                              style={{
                                padding: '3px 8px',
                                backgroundColor: 'var(--bg-main)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
