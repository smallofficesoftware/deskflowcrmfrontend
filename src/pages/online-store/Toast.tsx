import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Variant = 'success' | 'info' | 'warning' | 'danger';

export interface ToastOptions {
    id?: string;
    title?: string;
    message: string;
    variant?: Variant;
    duration?: number; // ms; 0 means persistent
}

export interface ToastInstance extends Required<ToastOptions> {
    id: string;
}

interface ToastContextApi {
    show: (opts: ToastOptions) => string;
    hide: (id: string) => void;
}

const ToastContext = createContext<ToastContextApi | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

const uuid = () => Math.random().toString(36).slice(2, 9);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastInstance[]>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = document.createElement('div');
        el.setAttribute('id', 'toast-root');
        document.body.appendChild(el);
        containerRef.current = el;
        return () => {
            document.body.removeChild(el);
        };
    }, []);

    const show = useCallback((opts: ToastOptions) => {
        const id = opts.id ?? `toast_${uuid()}`;
        const instance: ToastInstance = {
            id,
            title: opts.title ?? '',
            message: opts.message,
            variant: opts.variant ?? 'info',
            duration: opts.duration ?? 4000
        };
        setToasts((s) => [instance, ...s]); // newest on top
        return id;
    }, []);

    const hide = useCallback((id: string) => {
        setToasts((s) => s.filter(t => t.id !== id));
    }, []);

    const api = useMemo(() => ({ show, hide }), [show, hide]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {containerRef.current && createPortal(<ToastContainer toasts={toasts} onClose={hide} />, containerRef.current)}
        </ToastContext.Provider>
    );
};

const ToastContainer: React.FC<{ toasts: ToastInstance[]; onClose: (id: string) => void }> = ({ toasts, onClose }) => {
    return (
        <div className="toast-viewport" role="region" aria-live="polite" aria-atomic="true">
            {toasts.map(t => (
                <Toast key={t.id} toast={t} onClose={() => onClose(t.id)} />
            ))}

            <style>{`
        .toast-viewport {
          position: fixed;
          top: 16px;
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 1080;
          max-width: calc(100% - 32px);
        }

        @media (max-width: 576px) {
          .toast-viewport {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: min(92%, 420px);
            align-items: center;
          }
        }
      `}</style>
        </div>
    );
};

const variantColors: Record<Variant, { bg: string; accent: string }> = {
    success: { bg: '#f6fffa', accent: '#16a34a' },
    info: { bg: '#f0f7ff', accent: '#0ea5e9' },
    warning: { bg: '#fff8ec', accent: '#f59e0b' },
    danger: { bg: '#fff5f5', accent: '#ef4444' }
};

const Toast: React.FC<{ toast: ToastInstance; onClose: () => void }> = ({ toast, onClose }) => {
    const { id, title, message, variant, duration } = toast;
    const [visible, setVisible] = useState(true);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (duration > 0) {
            timerRef.current = window.setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 220);
            }, duration);
        }
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [duration, onClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setVisible(false);
                setTimeout(onClose, 220);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const colors = variantColors[variant];

    return (
        <div
            role="status"
            aria-live="polite"
            className={`toast-card ${visible ? 'enter' : 'exit'}`}
            onMouseEnter={() => { if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; } }}
            onMouseLeave={() => {
                if (duration > 0 && !timerRef.current) {
                    timerRef.current = window.setTimeout(() => {
                        setVisible(false);
                        setTimeout(onClose, 220);
                    }, 2500);
                }
            }}
            style={{ background: colors.bg, borderLeft: `4px solid ${colors.accent}` }}
        >
            <div className="toast-body">
                <div className="toast-content">
                    {title ? <div className="toast-title">{title}</div> : null}
                    <div className="toast-message">{message}</div>
                </div>

                <button className="toast-close" onClick={() => { setVisible(false); setTimeout(onClose, 180); }} aria-label="Close">
                    &times;
                </button>
            </div>

            <style>{`
        .toast-card {
          min-width: 280px;
          max-width: 420px;
          border-radius: 10px;
          padding: 12px 12px;
          box-shadow: 0 8px 24px rgba(12, 12, 16, 0.12);
          transition: transform 0.22s ease, opacity 0.22s ease;
          transform-origin: top right;
          opacity: 1;
          overflow: hidden;
        }
        .toast-card.enter {
          transform: translateY(-6px) scale(0.995);
          opacity: 0;
          animation: toastIn 220ms ease forwards;
        }
        .toast-card.exit {
          transform: translateY(0);
          opacity: 1;
          animation: toastOut 180ms ease forwards;
        }
        @keyframes toastIn {
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes toastOut {
          to { transform: translateY(-10px) scale(0.98); opacity: 0; }
        }

        .toast-body {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .toast-content {
          flex: 1 1 auto;
        }
        .toast-title {
          font-weight: 700;
          margin-bottom: 4px;
          color: rgba(0,0,0,0.85);
        }
        .toast-message {
          color: rgba(0,0,0,0.72);
          font-size: 0.95rem;
          line-height: 1.3;
        }

        .toast-close {
          appearance: none;
          border: none;
          background: transparent;
          color: rgba(0,0,0,0.5);
          font-size: 20px;
          line-height: 1;
          padding: 4px 6px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.12s ease, color 0.12s ease;
        }
        .toast-close:hover {
          background: rgba(0,0,0,0.06);
          color: rgba(0,0,0,0.85);
        }

        @media (max-width: 576px) {
          .toast-card { min-width: 92vw; max-width: 92vw; border-radius: 12px; }
        }
      `}</style>
        </div>
    );
};

export default Toast;