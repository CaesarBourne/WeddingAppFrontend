import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (msg, tone = 'info', ttl = 4000) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, msg, tone }]);
      if (ttl) setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss],
  );

  const toast = {
    info: (m, ttl) => push(m, 'info', ttl),
    ok: (m, ttl) => push(m, 'ok', ttl),
    err: (m, ttl) => push(m, 'err', ttl ?? 6000),
  };

  return (
    <ToastCtx.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
