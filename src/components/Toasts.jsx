import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

const ICONS = { ok: CheckCircle2, err: AlertCircle, info: Info };

export default function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] || Info;
          return (
            <motion.div
              key={t.id}
              className={`toast ${t.tone}`}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Icon className="ico" />
              <span className="msg">{t.msg}</span>
              <button className="btn btn-icon btn-ghost" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X className="ico" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
