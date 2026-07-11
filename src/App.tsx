import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext.tsx';
import { useRefresh } from './lib/queries.ts';
import { useToast } from './hooks/useToast.tsx';
import { errMessage } from './lib/api.ts';
import Header from './components/Header.tsx';
import Gallery, { Masthead } from './components/Gallery.tsx';
import UploadPanel from './components/UploadPanel.tsx';
import Login from './components/Login.tsx';
import GuestLanding from './components/GuestLanding.tsx';
import GuestWelcome from './components/GuestWelcome.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import UploaderPage from './components/UploaderPage.tsx';
import QRValidate from './components/QRValidate.tsx';
import QRScanner from './components/QRScanner.tsx';

function AdminRoute({ status, isAdmin }: Readonly<{ status: string; isAdmin: boolean }>) {
  if (status !== 'authed') return <Login />;
  if (isAdmin) return <AdminPanel />;
  return <Navigate to="/" replace />;
}

function GalleryPage() {
  const { toast } = useToast();
  const [total, setTotal] = useState<number | null>(null);
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
      <Route path="/guest" element={<GuestLanding />} />

      <Route
        path="/welcome"
        element={status === 'authed' ? <GuestWelcome /> : <GuestLanding />}
      />

      <Route path="/admin" element={<AdminRoute status={status} isAdmin={isAdmin} />} />

      <Route
        path="/gallery/uploader/:uploaderId"
        element={status === 'authed' ? <UploaderPage /> : <Login />}
      />

      <Route
        path="/qr/validate/:guestId"
        element={status === 'authed' && isAdmin ? <QRValidate /> : <Login />}
      />

      <Route
        path="/scan"
        element={status === 'authed' && isAdmin ? <QRScanner /> : <Login />}
      />

      <Route
        path="/"
        element={status === 'authed' ? <GalleryPage /> : <Login />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
