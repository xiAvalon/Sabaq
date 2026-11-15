// Shared feedback primitives: toasts, loading skeletons and the "coming soon" badge.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Icon } from './icons.jsx';

const ToastContext = createContext({ show: () => {} });
const TONE_ICON = { success: 'check', warning: 'info', error: 'close', info: 'info' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback(
    ({ text, tone = 'info', duration = 3200 }) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, text, tone }]);
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );
  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <span className="toast__icon">
              <Icon name={TONE_ICON[t.tone] ?? 'info'} size={16} />
            </span>
            <span className="toast__text">{t.text}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="إغلاق الإشعار">
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function SoonBadge({ label = 'قريبًا' }) {
  return <span className="soon">{label}</span>;
}

export function Skeleton({ lines = 3, block = false }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {block && <div className="skeleton__block" />}
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton__line" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

/** A labelled strip for preview screens that use sample data. */
export function PreviewNote({ children }) {
  return (
    <p className="preview-note">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </p>
  );
}
