import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserPlus, Trash2, Download, ArrowLeft, Loader2, QrCode,
  Copy, Check, ToggleLeft, ToggleRight, Camera, User,
  ShieldPlus, Eye, EyeOff, ScanLine,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext.tsx';
import { api, errMessage, API_BASE, uploadUserAvatar, createAdmin, deleteAdmin } from '../lib/api.ts';
import { useToast } from '../hooks/useToast.tsx';
import { brand } from '../lib/brand.ts';
import type { UserDto } from '../types.ts';

const PUBLIC_URL =
  (import.meta.env.VITE_PUBLIC_URL as string | undefined)?.replace(/\/$/, '') ??
  globalThis.location.origin;

function guestUrl(token: string): string {
  return `${PUBLIC_URL}/guest?t=${token}`;
}

function useUsers() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    api
      .get<UserDto[]>('/users')
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, []);
  return { users, loading, reload };
}

// ── QR Code cell ─────────────────────────────────────────────────────────────
function QrCell({ token }: Readonly<{ token: string }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

// ── User avatar (click-to-upload) ─────────────────────────────────────────────
function UserAvatar({ user, onUploaded }: Readonly<{ user: UserDto; onUploaded?: () => void }>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [version, setVersion] = useState(0);
  const { toast } = useToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadUserAvatar(user.id, file);
      setVersion((v) => v + 1);
      onUploaded?.();
      toast.ok(`Avatar updated for ${user.name}.`);
    } catch (err) {
      toast.err(errMessage(err, 'Could not upload avatar.'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const initials = (user.name || '?').slice(0, 2).toUpperCase();
  let overlayContent: React.ReactNode;
  if (uploading) overlayContent = <Loader2 className="ico spin-ico" />;
  else if (user.avatarUrl) overlayContent = <Camera style={{ width: 14, height: 14 }} />;
  else overlayContent = initials;

  return (
    <div className="user-avatar-wrap" title="Click to change photo">
      <div
        className={`user-avatar${uploading ? ' user-avatar--uploading' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        {user.avatarUrl ? (
          <img
            key={version}
            src={`${API_BASE}${user.avatarUrl}?v=${version}`}
            alt={user.name ?? undefined}
            className="user-avatar-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : null}
        <span className="user-avatar-initials" aria-hidden="true">
          {overlayContent}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}

// ── Guest row ─────────────────────────────────────────────────────────────────
interface UserRowProps {
  user: UserDto;
  onDelete: (id: string) => void;
  onToggleButton: (id: string, next: boolean) => void;
  onAvatarUploaded?: () => void;
}

function UserRow({ user, onDelete, onToggleButton, onAvatarUploaded }: Readonly<UserRowProps>) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
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

  async function handleToggleButton() {
    setToggling(true);
    const next = !user.buttonEnabled;
    try {
      await api.patch(`/users/guests/${user.id}/button`, { enabled: next });
      onToggleButton(user.id, next);
      toast.ok(`Second button ${next ? 'enabled' : 'disabled'} for ${user.name}.`);
    } catch (err) {
      toast.err(errMessage(err, 'Could not update guest.'));
    } finally {
      setToggling(false);
    }
  }

  const isGuest = user.role === 'guest';
  const ToggleIcon = user.buttonEnabled ? ToggleRight : ToggleLeft;
  const toggleIconEl = toggling
    ? <Loader2 className="ico spin-ico" />
    : <ToggleIcon className="ico" />;

  let admissionChip: React.ReactNode = null;
  if (isGuest) {
    admissionChip = user.admissionStatus === 'admitted'
      ? <span className="admission-chip admission-chip--admitted">Admitted</span>
      : <span className="admission-chip admission-chip--pending">Pending</span>;
  }

  return (
    <div className="user-row">
      <UserAvatar user={user} onUploaded={onAvatarUploaded} />
      <div className="user-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="user-name">{user.name || '—'}</span>
          <span className={`user-badge ${user.role}`}>{user.role}</span>
          {admissionChip}
        </div>
        {user.email && <span className="user-email">{user.email}</span>}
      </div>
      {isGuest && user.guestToken && <QrCell token={user.guestToken} />}
      {isGuest && (
        <div className="user-row-actions">
          <button
            className={`btn btn-ghost qr-btn toggle-btn${user.buttonEnabled ? ' toggle-btn-on' : ''}`}
            onClick={handleToggleButton}
            disabled={toggling}
            title={user.buttonEnabled ? "Disable guest's second button" : "Enable guest's second button"}
          >
            {toggleIconEl}
            {user.buttonEnabled ? 'Button on' : 'Button off'}
          </button>
          <button
            className="btn btn-ghost btn-icon btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Remove guest"
          >
            {deleting ? <Loader2 className="ico spin-ico" /> : <Trash2 className="ico" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Create Admin form (super_admin only) ──────────────────────────────────────
function CreateAdminForm({ onCreated }: Readonly<{ onCreated: () => void }>) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError('');
    setBusy(true);
    try {
      await createAdmin({ name: name.trim(), email: email.trim(), password });
      toast.ok(`Admin "${name.trim()}" created.`);
      setName(''); setEmail(''); setPassword('');
      onCreated();
    } catch (err) {
      setFormError(errMessage(err, 'Could not create admin.'));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  return (
    <div style={{ marginTop: 8 }}>
      {formError && (
        <div className="form-error" role="alert" style={{ marginBottom: 12 }}>
          <span>{formError}</span>
        </div>
      )}
      <form className="create-admin-form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="pw-field">
          <input
            className="input"
            type={showPw ? 'text' : 'password'}
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <button
            type="button"
            className="btn btn-icon btn-ghost pw-toggle"
            onClick={() => setShowPw((v) => !v)}
            tabIndex={-1}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
          </button>
        </div>
        <button className="btn btn-gold" type="submit" disabled={busy || !canSubmit}>
          {busy ? <Loader2 className="ico spin-ico" /> : <ShieldPlus className="ico" />}
          {busy ? 'Creating…' : 'Create admin'}
        </button>
      </form>
    </div>
  );
}

// ── Single admin account row (super_admin list) ───────────────────────────────
function AdminRow({ user, onDeleted, isSelf }: Readonly<{ user: UserDto; onDeleted: () => void; isSelf: boolean }>) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function handleDelete() {
    if (!confirm(`Remove admin "${user.name}"? They will lose all access immediately.`)) return;
    setDeleting(true);
    try {
      await deleteAdmin(user.id);
      onDeleted();
      toast.ok(`Removed admin ${user.name}.`);
    } catch (err) {
      toast.err(errMessage(err, 'Could not remove admin.'));
      setDeleting(false);
    }
  }

  return (
    <div className="user-row">
      <div className="user-info" style={{ flex: 1 }}>
        <span className="user-name">{user.name || '—'}</span>
        <span className={`user-badge ${user.role}`}>{user.role}</span>
        {isSelf && <span style={{ fontSize: '0.72rem', color: 'var(--faint)' }}>you</span>}
        {user.email && <span className="user-email">{user.email}</span>}
      </div>
      {!isSelf && (
        <button
          className="btn btn-ghost btn-icon btn-danger"
          onClick={handleDelete}
          disabled={deleting}
          title="Remove admin"
        >
          {deleting ? <Loader2 className="ico spin-ico" /> : <Trash2 className="ico" />}
        </button>
      )}
    </div>
  );
}

// ── Main AdminPanel ────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user: me, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { users, loading, reload } = useUsers();
  const { toast } = useToast();
  const [guestName, setGuestName] = useState('');
  const [busy, setBusy] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  async function createGuest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!guestName.trim() || busy) return;
    setGuestError('');
    setBusy(true);
    try {
      await api.post('/users/guests', { name: guestName.trim() });
      const created = guestName.trim();
      setGuestName('');
      toast.ok(`Guest "${created}" created.`);
      reload();
    } catch (err) {
      setGuestError(errMessage(err, 'Could not create guest.'));
    } finally {
      setBusy(false);
    }
  }

  const guests = users.filter((u) => u.role === 'guest');
  const adminAccounts = users.filter((u) => u.role === 'admin' || u.role === 'super_admin');

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
          <button className="btn btn-gold btn-scan-qr" onClick={() => navigate('/scan')}>
            <ScanLine className="ico" /> Scan QR
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="ico" /> Gallery
          </button>
          <button
            className="btn btn-ghost btn-icon btn-danger"
            onClick={logout}
            title="Sign out"
          >
            <ArrowLeft className="ico" style={{ transform: 'scaleX(-1)' }} />
          </button>
        </div>
      </motion.header>

      <main className="admin-main">
        {/* ── Create guest ── */}
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

          {guestError && (
            <div className="form-error" role="alert">
              <span>{guestError}</span>
            </div>
          )}

          <form className="create-guest-form" onSubmit={createGuest}>
            <input
              className="input"
              type="text"
              placeholder="Guest name (e.g. Uncle James)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={80}
              required
            />
            <button className="btn btn-gold" type="submit" disabled={busy || !guestName.trim()}>
              {busy ? <Loader2 className="ico spin-ico" /> : <UserPlus className="ico" />}
              {busy ? 'Creating…' : 'Create & get QR'}
            </button>
          </form>
        </motion.section>

        {/* ── Guest list ── */}
        <motion.section
          className="admin-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          <div className="admin-card-head">
            <User className="ico" style={{ color: 'var(--gold)' }} />
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
                <UserRow
                  key={u.id}
                  user={u}
                  onDelete={reload}
                  onToggleButton={reload}
                  onAvatarUploaded={reload}
                />
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Admin accounts (super_admin manages) ── */}
        {isSuperAdmin && (
          <motion.section
            className="admin-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
          >
            <div className="admin-card-head">
              <ShieldPlus className="ico" style={{ color: 'var(--gold)' }} />
              <h2>Admin accounts ({adminAccounts.length})</h2>
              <button
                className="btn btn-ghost qr-btn"
                style={{ marginLeft: 'auto' }}
                onClick={() => setShowCreateAdmin((v) => !v)}
              >
                {showCreateAdmin ? 'Cancel' : '+ Add admin'}
              </button>
            </div>
            <p className="admin-hint">
              Admin accounts can manage guests and scan QR codes at the entrance.
              Only you (super admin) can create or remove them.
            </p>

            {showCreateAdmin && (
              <CreateAdminForm
                onCreated={() => { setShowCreateAdmin(false); reload(); }}
              />
            )}

            {!loading && adminAccounts.length > 0 && (
              <div className="user-list" style={{ marginTop: showCreateAdmin ? 20 : 0 }}>
                {adminAccounts.map((u) => (
                  <AdminRow
                    key={u.id}
                    user={u}
                    onDeleted={reload}
                    isSelf={u.id === me?.id}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
}
