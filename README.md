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
| `VITE_WEDDING_DATE` | Eyebrow line on the masthead | `Igbeyawo, 2025` |
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
  main.jsx                 providers: QueryClient, Auth, Toast, BrowserRouter
  App.jsx                  auth gate + routing (/, /guest, /admin)
  index.css                design tokens + every component style
  lib/
    api.js                 axios client, token store, rawSrc(), error formatting
    queries.js             usePhotos (infinite), useUpload, useRefresh
    brand.js               names/date/tagline from env
  context/AuthContext.jsx  login, guestLogin, isAdmin, session validation, 401 handling
  hooks/useToast.jsx       toast context
  components/
    Header.jsx             wordmark, count, add/refresh/sign-out, admin nav button
    Gallery.jsx            masonry, infinite scroll, states, + Masthead
    PhotoTile.jsx          lazy image, hover caption, reveal
    Lightbox.jsx           full-screen viewer, keyboard nav, download
    UploadPanel.jsx        drag-drop, progress, bulk + failure reporting
    Login.jsx              sign-in
    Toasts.jsx             notifications
    GuestLanding.jsx       auto-auth from QR URL (/guest?t=TOKEN)
    AdminPanel.jsx         create/list/delete guests, QR code display & download
```

---

## Guest user system

### What it does

Admins can invite guests **without sharing a password**. The admin panel
generates a unique QR code per guest. Scanning it opens the app, logs the guest
in automatically, and takes them straight to the gallery — no form, no email.

### New routes

| Path | Who sees it | Purpose |
|---|---|---|
| `/guest?t=<token>` | Everyone (guests scan this) | Auto-authenticates and redirects to `/`. |
| `/admin` | Admin / super-admin only | Guest management panel. |

### Admin panel (`/admin`)

Accessible via the **Guests** button in the header (visible to admin roles only).

- **Create guest** — enter a name, click "Create & get QR". The QR code appears
  instantly in the guest list below.
- **QR code per guest** — rendered at 160 × 160 px in the app palette. Two
  actions per code:
  - **Save** — downloads a clean 512 × 512 px black-on-white PNG for printing.
  - **Copy link** — copies the full `/guest?t=…` URL to the clipboard.
- **Delete guest** — removes the account and invalidates their QR code. Any
  live session using that code will be rejected on the next request.

### Guest landing page (`GuestLanding.jsx`)

Reads `?t=TOKEN` from the URL, calls `POST /auth/guest` on the backend, stores
the returned JWT, then redirects to `/`. A `useRef` guard prevents
React StrictMode from firing the auth call twice.

If the token is missing or invalid, a styled error card is shown instead of a
redirect.

### `AuthContext` additions

| Export | Type | Purpose |
|---|---|---|
| `guestLogin(token)` | `async fn` | Exchanges a guest token for a JWT and updates auth state. |
| `isAdmin` | `boolean` | `true` when the current user's role is `admin` or `super_admin`. |

### New packages

| Package | Why |
|---|---|
| `react-router-dom` | Client-side routing — `BrowserRouter`, `Routes`, `Route`, `Navigate`. |
| `qrcode` | Renders QR codes to a `<canvas>` and exports a PNG data URL for download. |

### Bug fix — images not loading until backend restart

After a bulk upload, photos would show broken image icons until the backend was
restarted. Root cause: Google's `batchCreate` returns media items without a
`baseUrl` while it processes the upload. The cache was storing these incomplete
items, so every subsequent request for that image URL returned 404.

**Fix:** the frontend always points `<img>` tags at the backend's `/photos/:id/raw`
redirect (unchanged). The fix lives on the backend — `PhotoCacheService` now
skips caching any item that lacks a `baseUrl`, so broken URLs are never stored
and are resolved correctly once Google finishes processing.

### Environment variable (optional)

| Variable | Purpose | Default |
|---|---|---|
| `VITE_PUBLIC_URL` | Base URL embedded in guest QR codes (strip trailing slash) | `window.location.origin` |

Set this if the app is deployed behind a reverse proxy or custom domain so QR
codes point at the correct public address.
