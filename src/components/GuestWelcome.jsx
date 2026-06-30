import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../lib/brand.js';
import { avatarSrc, uploadMyAvatar, errMessage } from '../lib/api.js';
import { useToast } from '../hooks/useToast.jsx';

function AvatarUpload({ userId }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [version, setVersion] = useState(0);
  const { toast } = useToast();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadMyAvatar(file);
      setVersion((v) => v + 1);
      toast.ok('Profile photo updated.');
    } catch (err) {
      toast.err(errMessage(err, 'Could not upload photo.'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="welcome-avatar-wrap">
      <div className="welcome-avatar-ring">
        <img
          key={version}
          src={`${avatarSrc(userId)}?v=${version}`}
          alt="Your profile photo"
          className="welcome-avatar-img"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="welcome-avatar-initials" aria-hidden="true">
          <Camera style={{ width: 28, height: 28, opacity: 0.4 }} />
        </div>
      </div>

      <motion.button
        className="btn btn-ghost welcome-avatar-edit"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        title="Change profile photo"
      >
        <Camera className="ico" />
        {uploading ? 'Uploading…' : 'Edit photo'}
      </motion.button>

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

export default function GuestWelcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="welcome-shell">
      <motion.div
        className="welcome-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="welcome-eyebrow">
          {brand.date} · {brand.first} &amp; {brand.second}
        </div>

        {user?.id && <AvatarUpload userId={user.id} />}

        <h1 className="welcome-name">
          Welcome,<br />
          <span className="welcome-name-highlight">{user?.name ?? 'Guest'}</span>
        </h1>

        <p className="welcome-hint">
          You&rsquo;re all set — browse the wedding album and add your own photos to the collection.
        </p>

        <div className="welcome-actions">
          <motion.button
            className="btn btn-gold btn-welcome"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Image className="ico" />
            View Gallery
          </motion.button>

          <motion.button
            className="btn btn-welcome btn-welcome-secondary"
            disabled={!user?.buttonEnabled}
            title={user?.buttonEnabled ? undefined : 'Coming soon — stay tuned!'}
            onClick={() => user?.buttonEnabled && navigate('/?myAlbum=true')}
            whileHover={user?.buttonEnabled ? { scale: 1.02 } : {}}
            whileTap={user?.buttonEnabled ? { scale: 0.98 } : {}}
          >
            {user?.buttonEnabled ? (
              <Image className="ico" />
            ) : (
              <Lock className="ico" />
            )}
            {user?.buttonEnabled ? 'My Photos' : 'Coming Soon'}
          </motion.button>
        </div>

        {!user?.buttonEnabled && (
          <p className="welcome-coming-soon">
            A special feature is on its way — the wedding team will unlock it for you shortly.
          </p>
        )}
      </motion.div>
    </div>
  );
}
