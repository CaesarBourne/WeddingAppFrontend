import { motion } from 'framer-motion';
import { Upload, RefreshCw, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { brand } from '../lib/brand.ts';

interface HeaderProps {
  total: number | null;
  onUpload: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Header({ total, onUpload, onRefresh, refreshing }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header
      className="header"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="wordmark">
        <span className="names">{brand.first}</span>
        <span className="amp">&amp;</span>
        <span className="names">{brand.second}</span>
        {typeof total === 'number' && (
          <span className="header-meta">
            {total} {total === 1 ? 'photograph' : 'photographs'}
          </span>
        )}
      </div>

      <div className="header-actions">
        <button className="btn" onClick={onUpload}>
          <Upload className="ico" />
          <span className="label">Add photos</span>
        </button>
        {isAdmin && (
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/admin')}
            title="Manage guests"
          >
            <Settings className="ico" />
            <span className="label">Guests</span>
          </button>
        )}
        <button
          className="btn btn-ghost btn-icon"
          onClick={onRefresh}
          disabled={refreshing}
          title="Re-sync the album"
          aria-label="Re-sync the album"
        >
          <RefreshCw className={`ico ${refreshing ? 'spin-ico' : ''}`} />
        </button>
        <button
          className="btn btn-ghost btn-icon btn-danger"
          onClick={logout}
          title={`Sign out${user?.email ? ` (${user.email})` : ''}`}
          aria-label="Sign out"
        >
          <LogOut className="ico" />
        </button>
      </div>
    </motion.header>
  );
}
