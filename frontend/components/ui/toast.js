import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertIcon, CheckCircleIcon, XIcon } from './icons';

const ToastContext = createContext({ toast: () => {} });

function ToastItem({ toast, onClose }) {
  const toneClass = toast.type === 'error'
    ? 'border-red-200 bg-white text-red-700'
    : 'border-green-200 bg-white text-green-700';
  const Icon = toast.type === 'error' ? AlertIcon : CheckCircleIcon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-card ${toneClass}`}
      role="status"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message ? <p className="mt-1 text-xs text-slate-500">{toast.message}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="rounded-md p-1 text-slate-500"
        aria-label="Dismiss notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(({ type = 'success', title, message, duration = 3200 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current, { id, type, title, message }]);
    if (duration > 0) {
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, duration);
    }
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
