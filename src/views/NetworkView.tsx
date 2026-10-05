import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { VerificationBadge, Tag } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { UserCheck, Clock, ShieldCheck, MessageSquare, Check, X, UserPlus, Inbox } from 'lucide-react';

export const NetworkView: React.FC = () => {
  const { users, setSelectedProfile, startDirectMessage, setActiveTab } = useApp();
  const [networkTab, setNetworkTab] = useState<'connections' | 'pending' | 'intros'>('connections');

  const myConnections = users.filter((u) => u.isConnection);
  const pendingIntros = users.filter((u) => u.isPendingIntro);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'connections', label: `Connections (${myConnections.length})`, icon: <UserCheck size={16} /> },
          { id: 'pending', label: `Pending introductions (${pendingIntros.length})`, icon: <Clock size={16} /> },
          { id: 'intros', label: 'History', icon: <ShieldCheck size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setNetworkTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: networkTab === tab.id ? 'var(--bg-surface-elevated)' : 'transparent',
              color: networkTab === tab.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
              border: networkTab === tab.id ? '1px solid var(--accent-gold-border)' : '1px solid transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Connections List */}
      {networkTab === 'connections' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {myConnections.length === 0 ? (
            <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', maxWidth: '420px', margin: '0 auto' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <UserPlus size={24} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  No direct connections yet
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Discover members in the network or ask for introductions.
                </p>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('discover')}>
                  Discover people
                </Button>
              </div>
            </Card>
          ) : (
            myConnections.map((user) => (
              <Card key={user.id} hoverable onClick={() => setSelectedProfile(user)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="lg"
                      verificationLevel={user.verificationLevel}
                    />
                    <VerificationBadge level={user.verificationLevel} size="sm" />
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {user.name}
                    </h4>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-gold)', marginTop: '2px' }}>
                      {user.role} · {user.company}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {user.location} · {user.industry}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      icon={<MessageSquare size={13} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        startDirectMessage(user);
                      }}
                    >
                      Message
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfile(user);
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pending Introductions */}
      {networkTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingIntros.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', maxWidth: '420px', margin: '0 auto' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Inbox size={24} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  No pending introductions
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Introduction requests sent or received will appear here.
                </p>
              </div>
            </Card>
          ) : (
            pendingIntros.map((user) => (
              <Card key={user.id} padding="md">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="md"
                      verificationLevel={user.verificationLevel}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {user.name}
                        </h4>
                        <VerificationBadge level={user.verificationLevel} size="sm" />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                        {user.role} · {user.company}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" size="sm" icon={<X size={14} />}>
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Check size={14} />}
                      onClick={() => startDirectMessage(user)}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* History */}
      {networkTab === 'intros' && (
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                from: 'Ananya Sharma',
                to: 'Tariq Bhatt',
                topic: 'D2C distribution & retail expansion',
                date: 'Sep 12, 2026',
                status: 'Connected'
              }
            ].map((intro, idx) => (
              <div key={idx} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <span>{intro.from} → {intro.to}</span>
                  <Tag variant="accent" size="sm">{intro.status}</Tag>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Reason: {intro.topic}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Introduced on {intro.date}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
