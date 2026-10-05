import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { useApp } from '../context/AppContext';
import { Send, ArrowLeft, MessageSquareX } from 'lucide-react';

export const MessagesView: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    currentUser,
    setSelectedProfile
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;
    await sendMessage(activeConv.id, inputMessage);
    setInputMessage('');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileShowThread(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: '520px',
        maxHeight: '800px'
      }}
    >
      <div
        className="fh-messages-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '1rem',
          height: '100%'
        }}
      >
        {/* Conversations List Panel */}
        <div className={`fh-messages-list ${mobileShowThread ? 'fh-messages-mobile-hide' : ''}`} style={{ height: '100%' }}>
          <Card padding="none" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Messages</h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {conversations.map((conv) => {
                const isActive = conv.id === activeConv?.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <Avatar
                        name={conv.participant.name}
                        src={conv.participant.avatar}
                        size="md"
                        verificationLevel={conv.participant.verificationLevel}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.participant.name}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {conv.lastMessageTime}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 500 }}>
                          {conv.participant.role} · {conv.participant.company}
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px', margin: 0 }}>
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Active Conversation Panel */}
        <div className={`fh-messages-thread ${!mobileShowThread ? 'fh-messages-mobile-hide-thread' : ''}`} style={{ height: '100%' }}>
          {activeConv ? (
            <Card padding="none" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className="fh-messages-mobile-back"
                    onClick={() => setMobileShowThread(false)}
                    style={{
                      display: 'none',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div
                    onClick={() => setSelectedProfile(activeConv.participant)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
                  >
                    <Avatar
                      name={activeConv.participant.name}
                      src={activeConv.participant.avatar}
                      size="sm"
                    />
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {activeConv.participant.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {activeConv.participant.role} · {activeConv.participant.company}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Note / Intro Banner */}
              {activeConv.introContext && (
                <div
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'var(--accent-gold-bg)',
                    borderBottom: '1px solid var(--accent-gold-border)',
                    fontSize: '0.78rem',
                    color: 'var(--accent-gold)'
                  }}
                >
                  Introduced by <strong>{activeConv.introContext.facilitatedBy}</strong>
                  {activeConv.introContext.topic && <span> — "{activeConv.introContext.topic}"</span>}
                </div>
              )}

              {/* Messages History */}
              <div
                style={{
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                {activeConv.messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '10px 14px',
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          backgroundColor: isMe ? 'var(--accent-gold-bg)' : 'var(--bg-surface-elevated)',
                          border: isMe ? '1px solid var(--accent-gold-border)' : '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '0.88rem',
                          lineHeight: 1.45
                        }}
                      >
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: '0.85rem 1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                <Button variant="primary" type="submit" icon={<Send size={15} />}>
                  Send
                </Button>
              </form>
            </Card>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquareX size={24} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Select a conversation</div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fh-messages-layout {
            grid-template-columns: 1fr !important;
          }
          .fh-messages-mobile-hide {
            display: none !important;
          }
          .fh-messages-mobile-hide-thread {
            display: none !important;
          }
          .fh-messages-mobile-back {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
