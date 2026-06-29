import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, X, Trash2, Loader2, ImagePlus } from 'lucide-react';
import { useUpload } from '../lib/queries.js';
import { useToast } from '../hooks/useToast.jsx';
import { errMessage } from '../lib/api.js';

const ACCEPT = 'image/*,video/*';
const MAX_FILES = 200;

function prettySize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadPanel({ onClose }) {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const upload = useUpload(setProgress);
  const busy = upload.isPending;

  // Object URLs for instant thumbnails; revoke on change/unmount.
  const previews = useMemo(
    () => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  function addFiles(list) {
    const incoming = Array.from(list).filter((f) =>
      /^(image|video)\//.test(f.type),
    );
    if (!incoming.length) {
      toast.err('Only image and video files can be added.');
      return;
    }
    setFiles((prev) => {
      const merged = [...prev];
      for (const f of incoming) {
        if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
      }
      if (merged.length > MAX_FILES) {
        toast.err(`Up to ${MAX_FILES} files per upload — extras were skipped.`);
      }
      return merged.slice(0, MAX_FILES);
    });
  }

  function removeAt(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function start() {
    if (!files.length || busy) return;
    setProgress(0);
    try {
      const res = await upload.mutateAsync({ files, description: description.trim() });
      if (res.failedCount > 0) {
        toast.err(
          `${res.createdCount} added, ${res.failedCount} failed${
            res.failed[0]?.reason ? ` — ${res.failed[0].reason}` : ''
          }`,
        );
      } else {
        toast.ok(
          res.createdCount === 1
            ? 'Photo added to the album.'
            : `${res.createdCount} photos added to the album.`,
        );
      }
      onClose();
    } catch (err) {
      toast.err(errMessage(err, 'Upload failed.'));
      setProgress(0);
    }
  }

  return (
    <div className="scrim" onClick={busy ? undefined : onClose}>
      <motion.div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="Add photos"
      >
        <div className="sheet-head">
          <h2>Add photos</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} disabled={busy} aria-label="Close">
            <X className="ico" />
          </button>
        </div>

        <div className="sheet-body">
          <div
            className={`dropzone ${over ? 'over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              addFiles(e.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          >
            <UploadCloud className="ico" />
            <p>
              Drag photos &amp; videos here, or <span className="pick">browse</span>
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>

          {files.length > 0 && (
            <>
              <div className="queue">
                {previews.map((p, i) => (
                  <div className="q-item" key={`${p.file.name}-${i}`}>
                    {p.file.type.startsWith('image/') ? (
                      <img className="q-thumb" src={p.url} alt="" />
                    ) : (
                      <div className="q-thumb" style={{ display: 'grid', placeItems: 'center' }}>
                        <ImagePlus style={{ width: 18, height: 18, color: 'var(--faint)' }} />
                      </div>
                    )}
                    <div className="q-meta">
                      <div className="q-name">{p.file.name}</div>
                      <div className="q-size">{prettySize(p.file.size)}</div>
                    </div>
                    {!busy && (
                      <button
                        className="btn btn-icon btn-ghost"
                        onClick={() => removeAt(i)}
                        aria-label={`Remove ${p.file.name}`}
                      >
                        <Trash2 className="ico" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="desc">Caption (optional)</label>
                <input
                  id="desc"
                  className="input"
                  placeholder="A note to remember these by…"
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={busy}
                />
              </div>
            </>
          )}

          {busy && (
            <div className="progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="upload-foot">
            <span className="spacer" />
            <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn-gold" onClick={start} disabled={!files.length || busy}>
              {busy ? <Loader2 className="ico spin-ico" /> : <UploadCloud className="ico" />}
              {busy
                ? `Uploading… ${progress}%`
                : files.length > 1
                  ? `Add ${files.length} photos`
                  : 'Add photo'}
            </button>
          </div>

          <p className="muted-note">
            Photos upload into the shared wedding album on the backend. Up to {MAX_FILES} files
            at a time; each under 200&nbsp;MB.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
