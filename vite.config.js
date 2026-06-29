import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The frontend talks to the backend over absolute URLs (VITE_API_BASE_URL),
// and the backend already enables CORS — so no dev proxy is needed.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
});
