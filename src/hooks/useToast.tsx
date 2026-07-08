import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Toast, ToastContextValue } from '../types.ts';

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (msg: string, tone: Toast['tone'] = 'info', ttl = 4000): number => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, msg, tone }]);
      if (ttl) setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss],
  );

  const toast: ToastContextValue['toast'] = {
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

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
