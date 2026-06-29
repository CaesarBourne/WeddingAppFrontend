# The Wedding Album — Frontend

A React + Vite single-page app for the Wedding Photos NestJS backend. Browse the
shared album in a gallery-wall lightbox, and upload photos or videos (single or
in bulk) straight into the app-managed Google Photos album.

## Design

The interface is built as a **gallery wall at dusk**: a deep, warm aubergine room
where the photographs are the only color and light. Chrome is drawn in thin
champagne hairlines; **Fraunces** carries the romance (the names, the moments) and
**Instrument Sans** does the interface work. Motion is deliberate — a page-load
sequence, scroll-triggered reveals on each photo, a soft lightbox transition — and
all of it respects `prefers-reduced-motion`.

## Stack

- **Vite 5** + **React 18**
- **@tanstack/react-query** — paginated infinite feed with caching and request dedup
- **axios** — single client with a JWT interceptor
- **framer-motion** — entrance, reveal, and lightbox animation
- **lucide-react** — icons

No CSS framework: the look is a hand-built token system in `src/index.css`.

## Quick start

```bash
npm install
cp .env.example .env          # point VITE_API_BASE_URL at your backend
npm run dev                   # http://localhost:5173
```

Make sure the backend is running (default `http://localhost:3000`) and has a seeded
admin. Sign in with the backend's `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.

### Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Where the NestJS backend lives (no trailing slash) | `http://localhost:3000` |
| `VITE_COUPLE_NAMES` | Names shown in the wordmark/masthead, split on `&` | `Amara & Sefu` |
| `VITE_WEDDING_DATE` | Eyebrow line on the masthead | `Midsummer, 2025` |
| `VITE_TAGLINE` | Sub-line under the names | (a default sentence) |

## How it talks to the API — efficiently

- **Stable image URLs.** Every `<img>`/`<video>` points at the backend's public
  `/photos/:id/raw` redirect, never at a raw Google URL. Those Google URLs expire in
  ~60 minutes; the redirect always resolves a fresh one, so images never break. The
  app swaps the `size` hint per context: `w700` in the grid, `w1600` in the lightbox,
  `download` for the save button — so the gallery pulls small files and bandwidth
  stays low.
- **Infinite, cached pagination.** The gallery uses a React Query infinite query
  (`pageSize=24`). Pages are cached, in-flight requests are deduped and abortable, and
  scrolling back up costs nothing. A new page loads only when an `IntersectionObserver`
  sentinel nears the viewport.
- **Lazy + reserved layout.** Images are `loading="lazy"` / `decoding="async"`, and each
  tile reserves its aspect-ratio box so the masonry doesn't reflow as photos arrive.
- **Neighbour preload.** Opening the lightbox quietly prefetches the previous and next
  full-size images for instant navigation.
- **One upload path.** One file hits `POST /photos/upload`; several hit
  `/photos/upload/bulk`. Byte-level progress is shown, and per-file failures from the
  bulk response are surfaced in a toast. A successful upload invalidates the gallery
  cache so the new photos appear.

## A note on the login gate

The backend guards `GET /photos` with a JWT, so the gallery sits behind sign-in. The
image bytes themselves load without a token (the `/raw` route is public), which is why
photos render fine once you're in.

If you'd rather let guests browse **without** logging in, mark the list endpoint public
in the backend — add `@Public()` to `GET /photos` in `photos.controller.ts` — and this
app's gallery will work for anyone. (Uploading and re-syncing stay behind auth.)

## Scripts

```bash
npm run dev       # dev server with HMR
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

## Project shape

```
src/
  main.jsx                 providers: QueryClient, Auth, Toast
  App.jsx                  auth gate + layout
  index.css                design tokens + every component style
  lib/
    api.js                 axios client, token store, rawSrc(), error formatting
    queries.js             usePhotos (infinite), useUpload, useRefresh
    brand.js               names/date/tagline from env
  context/AuthContext.jsx  login, session validation, 401 handling
  hooks/useToast.jsx       toast context
  components/
    Header.jsx             wordmark, count, add/refresh/sign-out
    Gallery.jsx            masonry, infinite scroll, states, + Masthead
    PhotoTile.jsx          lazy image, hover caption, reveal
    Lightbox.jsx           full-screen viewer, keyboard nav, download
    UploadPanel.jsx        drag-drop, progress, bulk + failure reporting
    Login.jsx              sign-in
    Toasts.jsx             notifications
```
