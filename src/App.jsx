import { useState } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext.jsx';
import { useRefresh } from './lib/queries.js';
import { useToast } from './hooks/useToast.jsx';
import { errMessage } from './lib/api.js';
import Header from './components/Header.jsx';
import Gallery, { Masthead } from './components/Gallery.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import Login from './components/Login.jsx';
import GuestLanding from './components/GuestLanding.jsx';
import AdminPanel from './components/AdminPanel.jsx';

function AdminRoute({ status, isAdmin }) {
  if (status !== 'authed') return <Login />;
  if (isAdmin) return <AdminPanel />;
  return <Navigate to="/" replace />;
}
AdminRoute.propTypes = { status: PropTypes.string.isRequired, isAdmin: PropTypes.bool.isRequired };

function GalleryPage() {
  const { toast } = useToast();
  const [total, setTotal] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const refresh = useRefresh();

  async function doRefresh() {
    try {
      const res = await refresh.mutateAsync();
      toast.ok(`Album re-synced — ${res.total} ${res.total === 1 ? 'photo' : 'photos'}.`);
    } catch (err) {
      toast.err(errMessage(err, 'Could not re-sync the album.'));
    }
  }

  return (
    <>
      <Header
        total={total}
        onUpload={() => setUploadOpen(true)}
        onRefresh={doRefresh}
        refreshing={refresh.isPending}
      />
      <main>
        <Masthead />
        <Gallery onTotal={setTotal} onUpload={() => setUploadOpen(true)} />
      </main>
      <AnimatePresence>
        {uploadOpen && <UploadPanel onClose={() => setUploadOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const { status, isAdmin } = useAuth();

  if (status === 'checking') {
    return (
      <div className="center-screen">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public: guests scan their QR code and land here to auto-authenticate */}
      <Route path="/guest" element={<GuestLanding />} />

      {/* Admin panel — requires an admin/super_admin session */}
      <Route path="/admin" element={<AdminRoute status={status} isAdmin={isAdmin} />} />

      {/* Main gallery — any authenticated user (admin or guest) */}
      <Route
        path="/"
        element={status === 'authed' ? <GalleryPage /> : <Login />}
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
