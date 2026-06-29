import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Download, ArrowLeft, Loader2, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext.jsx';
import { api, errMessage, API_BASE } from '../lib/api.js';
import { useToast } from '../hooks/useToast.jsx';
import { brand } from '../lib/brand.js';

const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, '') || globalThis.location.origin;

function guestUrl(token) {
  return `${PUBLIC_URL}/guest?t=${token}`;
}

function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    api.get('/users')
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);
  return { users, loading, reload };
}

function QrCell({ token }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const url = guestUrl(token);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 160,
        margin: 1,
        color: { dark: '#F4EBE3', light: '#261B29' },
      });
    }
  }, [url]);

  function download() {
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `wedding-qr-${token.slice(0, 8)}.png`;
      a.click();
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="qr-cell">
      <canvas ref={canvasRef} className="qr-canvas" />
      <div className="qr-actions">
        <button className="btn btn-ghost qr-btn" onClick={download} title="Download QR code">
          <Download className="ico" /> Save
        </button>
        <button className="btn btn-ghost qr-btn" onClick={copyLink} title="Copy guest link">
          {copied ? <Check className="ico" /> : <Copy className="ico" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}

function UserRow({ user, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function handleDelete() {
    if (!confirm(`Remove guest "${user.name}"? This will invalidate their QR code.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/users/guests/${user.id}`);
      onDelete(user.id);
      toast.ok(`Removed ${user.name}.`);
    } catch (err) {
      toast.err(errMessage(err, 'Could not remove guest.'));
      setDeleting(false);
    }
  }

  const isGuest = user.role === 'guest';

  return (
    <div className="user-row">
      <div className="user-info">
        <span className="user-name">{user.name || '—'}</span>
        <span className={`user-badge ${user.role}`}>{user.role}</span>
        {user.email && <span className="user-email">{user.email}</span>}
      </div>

      {isGuest && user.guestToken && (
        <QrCell token={user.guestToken} />
      )}

      {isGuest && (
        <button
          className="btn btn-ghost btn-icon btn-danger"
          onClick={handleDelete}
          disabled={deleting}
          title="Remove guest"
        >
          {deleting ? <Loader2 className="ico spin-ico" /> : <Trash2 className="ico" />}
        </button>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { users, loading, reload } = useUsers();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function createGuest(e) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setError('');
    setBusy(true);
    try {
      await api.post('/users/guests', { name: name.trim() });
      setName('');
      toast.ok(`Guest "${name.trim()}" created.`);
      reload();
    } catch (err) {
      setError(errMessage(err, 'Could not create guest.'));
    } finally {
      setBusy(false);
    }
  }

  function removeFromList(id) {
    reload();
  }

  const guests = users.filter((u) => u.role === 'guest');
  const admins = users.filter((u) => u.role !== 'guest');

  return (
    <div className="admin-shell">
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
          <span className="header-meta">Guest Management</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="ico" /> Gallery
          </button>
          <button className="btn btn-ghost btn-icon btn-danger" onClick={logout} title="Sign out">
            <ArrowLeft className="ico" style={{ transform: 'scaleX(-1)' }} />
          </button>
        </div>
      </motion.header>

      <main className="admin-main">
        {/* Create guest */}
        <motion.section
          className="admin-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="admin-card-head">
            <QrCode className="ico" style={{ color: 'var(--gold)' }} />
            <h2>Invite a guest</h2>
          </div>
          <p className="admin-hint">
            Enter the guest&rsquo;s name to generate a unique QR code. They scan it to instantly
            sign in and upload photos — no password needed.
          </p>

          {error && (
            <div className="form-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form className="create-guest-form" onSubmit={createGuest}>
            <input
              className="input"
              type="text"
              placeholder="Guest name (e.g. Uncle James)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
            <button className="btn btn-gold" type="submit" disabled={busy || !name.trim()}>
              {busy ? <Loader2 className="ico spin-ico" /> : <UserPlus className="ico" />}
              {busy ? 'Creating…' : 'Create & get QR'}
            </button>
          </form>
        </motion.section>

        {/* Guest list */}
        <motion.section
          className="admin-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          <div className="admin-card-head">
            <h2>Guests ({guests.length})</h2>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <span className="spinner" />
            </div>
          ) : guests.length === 0 ? (
            <p className="admin-hint">No guests yet — create one above.</p>
          ) : (
            <div className="user-list">
              {guests.map((u) => (
                <UserRow key={u.id} user={u} onDelete={removeFromList} />
              ))}
            </div>
          )}
        </motion.section>

        {/* Admin accounts (read-only) */}
        {admins.length > 0 && (
          <motion.section
            className="admin-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
          >
            <div className="admin-card-head">
              <h2>Admin accounts ({admins.length})</h2>
            </div>
            <div className="user-list">
              {admins.map((u) => (
                <UserRow key={u.id} user={u} onDelete={() => {}} />
              ))}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
