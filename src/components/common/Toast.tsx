import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '360px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: `1px solid ${
              toast.type === 'success'
                ? 'var(--verified-green-border)'
                : toast.type === 'error'
                ? 'rgba(239, 68, 68, 0.3)'
                : 'var(--accent-gold-border)'
            }`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            animation: 'toastFadeIn 150ms ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--verified-green)', flexShrink: 0 }} />}
            {toast.type === 'error' && <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {toast.title}
            </span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex'
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
