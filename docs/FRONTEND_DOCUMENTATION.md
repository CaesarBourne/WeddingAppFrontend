# Wedding App — Frontend Documentation

> Generated: July 2026 | Version: 1.0.0
> Cross-referenced against `docs/api.md`

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Environment Variables](#environment-variables)
3. [Application Architecture](#application-architecture)
4. [Routing](#routing)
5. [Authentication & Auth Flow](#authentication--auth-flow)
6. [API Integration](#api-integration)
   - [Axios Setup & Interceptors](#axios-setup--interceptors)
   - [All Endpoints Called by the Frontend](#all-endpoints-called-by-the-frontend)
7. [Data Flow](#data-flow)
8. [Component Reference](#component-reference)
9. [State Management](#state-management)
10. [User Journey Flows](#user-journey-flows)
    - [Admin Journey](#admin-journey)
    - [Guest Journey](#guest-journey)
    - [QR Entrance Scan Journey](#qr-entrance-scan-journey)
11. [API Implementation Gap Analysis](#api-implementation-gap-analysis)
12. [Known Limitations & TODOs](#known-limitations--todos)

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | React | 18.3 |
| Build tool | Vite | 5.4 |
| Language | TypeScript | 6.x |
| Routing | React Router DOM | 7.x |
| HTTP client | Axios | 1.7 |
| Server-state / caching | TanStack React Query | 5.x |
| Animation | Framer Motion | 11.x |
| Icons | Lucide React | 0.427 |
| QR code generation | qrcode | 1.5 |

---

## Environment Variables

All variables are prefixed `VITE_` and injected at build time via Vite.


| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the NestJS backend. No trailing slash. |
| `VITE_COUPLE_NAMES` | `Amara & Sefu` | Couple names shown in headers and branding. Format: `First & Second`. |
| `VITE_WEDDING_DATE` | `Igbeyawo, 2025` | Date string shown in the masthead and welcome card. |
| `VITE_TAGLINE` | `Every frame from the day…` | Tagline shown under the couple names in the gallery masthead. |
| `VITE_PUBLIC_URL` | `window.location.origin` | Used to construct the full guest QR link in the Admin Panel. Falls back to `window.location.origin` if not set. |

> All branding variables are consumed in `src/lib/brand.ts` and used across Login, Gallery, GuestWelcome, and AdminPanel.

---

## Application Architecture

```
main.tsx
└── BrowserRouter
    └── QueryClientProvider (TanStack React Query)
        └── ToastProvider
            └── AuthProvider
                └── App.tsx  ← route switcher
                    ├── /                  → GalleryPage (Header + Gallery + UploadPanel)
                    ├── /guest             → GuestLanding
                    ├── /welcome           → GuestWelcome
                    ├── /admin             → AdminPanel
                    ├── /gallery/uploader/:uploaderId → UploaderPage
                    └── /qr/validate/:guestId         → QRValidate
```

**AuthProvider** owns the JWT, the authenticated user object, and the login/logout methods.
**ToastProvider** owns a global notification stack (info / ok / err tones).
**QueryClientProvider** owns all server-state caching (photos list, upload mutations, refresh mutation).

---

## Routing

| Path | Component | Auth guard |
|---|---|---|
| `/` | `GalleryPage` | Must be `authed`; else shows `Login` |
| `/guest?t=<token>` | `GuestLanding` | Public — auto-logs in the guest via QR token |
| `/welcome` | `GuestWelcome` | Must be `authed`; else shows `GuestLanding` |
| `/admin` | `AdminPanel` | Must be `authed` + `isAdmin`; else shows `Login` |
| `/gallery/uploader/:uploaderId` | `UploaderPage` | Must be `authed`; else shows `Login` |
| `/qr/validate/:guestId` | `QRValidate` | Must be `authed` + `isAdmin`; else shows `Login` |
| `*` (catch-all) | — | Redirects to `/` |

> `isAdmin` is `true` when `user.role === 'admin'` or `user.role === 'super_admin'`.

---

## Authentication & Auth Flow

### Token Storage

The JWT is stored in `localStorage` under the key `wpa_jwt` (managed by `tokenStore` in `src/lib/api.ts`).

### Startup / Session Restore

On app load, `AuthProvider` checks for a saved token:
1. If no token → `status = 'guest'` (skip API call).
2. If token exists → `status = 'checking'`, then calls `GET /auth/me`.
   - On success → `status = 'authed'`, user object populated from response.
   - On failure → calls `logout()` which clears the token and sets `status = 'guest'`.

### Unauthorized Event Bus

The Axios response interceptor fires a `wpa:unauthorized` custom DOM event on any `401` response.
`AuthProvider` listens for this event and calls `logout()`, clearing stale sessions globally.

### Admin Login (`POST /auth/login`)

`Login.tsx` → `useAuth().login(email, password)` → `POST /auth/login`
- Receives `{ accessToken, user }`.
- Stores token, sets user + `status = 'authed'`.

### Guest QR Login (`POST /auth/guest`)

`GuestLanding.tsx` → `useAuth().guestLogin(token)` → `POST /auth/guest`
- Token comes from the URL query param `?t=<token>`.
- Same flow as admin: receives `{ accessToken, user }`, stores token, redirects to `/welcome`.
- If the user is already authed as an admin and scans a guest QR → redirects to `/qr/validate/:guestId` instead.

---

## API Integration

### Axios Setup & Interceptors

File: `src/lib/api.ts`

```
api = axios.create({ baseURL: VITE_API_BASE_URL })
```

**Request interceptor** — attaches `Authorization: Bearer <token>` from `localStorage` on every outgoing request.

**Response interceptor** — on `401`, dispatches `wpa:unauthorized` DOM event to trigger global logout.

**Helper functions exported from `api.ts`:**

| Function | Description |
|---|---|
| `rawSrc(id, size)` | Returns `{API_BASE}/photos/{id}/raw?size={size}` — stable, non-expiring image URL |
| `avatarSrc(userId)` | Returns `{API_BASE}/users/{userId}/avatar` — public avatar URL |
| `errMessage(error, fallback)` | Extracts a readable string from an Axios error |
| `isVideo(mimeType)` | Returns true if mimeType starts with `video/` |
| `uploadMyAvatar(file)` | `POST /users/me/avatar` multipart |
| `uploadUserAvatar(userId, file)` | `PATCH /users/{id}/avatar` multipart |
| `getGuestInfo(token)` | `POST /auth/guest-info` |
| `admitGuest(guestId)` | `POST /users/{id}/admit` |
| `getGuestAdmission(guestId)` | `GET /users/{id}` |

---

### All Endpoints Called by the Frontend

#### Auth Endpoints

| Method | Path | Where Used | Purpose |
|---|---|---|---|
| `POST` | `/auth/login` | `AuthContext.login()` → `Login.tsx` | Admin login with email + password |
| `POST` | `/auth/guest` | `AuthContext.guestLogin()` → `GuestLanding.tsx` | Guest login via QR token |
| `GET` | `/auth/me` | `AuthContext` (startup) | Restore session from stored JWT |
| `POST` | `/auth/guest-info` | `api.getGuestInfo()` → `GuestLanding.tsx` | Admin: look up guest by QR token without starting a session |

> **Not called:** `POST /auth/admins` and `GET /auth/admins` — these exist in the API but there is **no UI** in the frontend to create or list admins.

---

#### User Endpoints

| Method | Path | Where Used | Purpose |
|---|---|---|---|
| `GET` | `/users` | `AdminPanel.tsx` (`useUsers` hook) | Load full guest + admin list |
| `GET` | `/users/:id` | `api.getGuestAdmission()` → `QRValidate.tsx` | Fetch a single guest's admission status |
| `POST` | `/users/guests` | `AdminPanel.tsx` (`createGuest`) | Create a new guest and get their QR token |
| `DELETE` | `/users/guests/:id` | `AdminPanel.tsx` (`UserRow.handleDelete`) | Delete a guest |
| `PATCH` | `/users/guests/:id/button` | `AdminPanel.tsx` (`UserRow.handleToggleButton`) | Enable/disable the "second button" on guest's welcome page |
| `POST` | `/users/me/avatar` | `api.uploadMyAvatar()` → `GuestWelcome.tsx` | Guest uploads their own profile photo |
| `PATCH` | `/users/:id/avatar` | `api.uploadUserAvatar()` → `AdminPanel.tsx` | Admin uploads/changes any user's avatar |
| `GET` | `/users/:id/avatar` | `avatarSrc()` used in `<img src>` | Display a user's avatar image (public, no auth needed) |
| `POST` | `/users/:id/admit` | `api.admitGuest()` → `QRValidate.tsx` | Admit a guest at the event entrance |

> **Not called:** `POST /users/admins` and `DELETE /users/admins/:id` — admin account management has **no UI**.

---

#### Photo Endpoints

| Method | Path | Where Used | Purpose |
|---|---|---|---|
| `GET` | `/photos` | `queries.usePhotos()` → `Gallery.tsx`, `UploaderPage.tsx` | Paginated photo list (infinite scroll, page size 24) |
| `POST` | `/photos/upload` | `queries.useUpload()` → `UploadPanel.tsx` | Upload a single image/video |
| `POST` | `/photos/upload/bulk` | `queries.useUpload()` → `UploadPanel.tsx` | Bulk upload (used when >1 file selected) |
| `POST` | `/photos/refresh` | `queries.useRefresh()` → `Header.tsx` | Force album re-sync from Google Photos |
| `GET` | `/photos/:id/raw` | `rawSrc()` used in `<img src>`, `<video src>`, Lightbox download link | Redirect to a fresh Google URL for display/download |

> **Not called:** `GET /photos/:id` (fetch single photo DTO) — the frontend never fetches a single photo by ID; it works off the paginated list.

---

#### Google OAuth Endpoints

| Method | Path | Where Used | Notes |
|---|---|---|---|
| `GET` | `/google/auth-url` | **Not called** | Setup-only, no frontend UI |
| `GET` | `/google/callback` | **Not called** | Server-side OAuth redirect, no frontend UI |

---

## Data Flow

### Photo Loading (Gallery)

```
Gallery.tsx
  └── usePhotos() [React Query infinite query]
        └── GET /photos?page=N&pageSize=24
              → PagedPhotos { data: PhotoDto[], meta: PaginationMeta }
        → data.pages.flatMap(p => p.data)  ← flat array of all loaded photos
        → grouped by uploaderId into UploaderGroup[]
        → sorted by lastUploadedAt DESC
        → admins see all groups; guests see only their own group
        → IntersectionObserver on sentinel div → fetchNextPage()
```

Each `PhotoDto.rawUrl` (or the `rawSrc()` helper) points to `/photos/:id/raw?size=...`.
The browser hits that endpoint, which redirects `302` to a fresh Google URL.
This means images never have expiry issues on the frontend.

### Photo Upload

```
UploadPanel.tsx
  └── useUpload(setProgress) [React Query mutation]
        ├── 1 file  → POST /photos/upload        (FormData: file, description)
        └── >1 file → POST /photos/upload/bulk   (FormData: files[], description)
              → UploadResult { createdCount, failedCount, created[], failed[] }
        → onSuccess: invalidateQueries(['photos']) → Gallery refetches
```

Upload progress is tracked via Axios `onUploadProgress` and shown as a progress bar.

### Auth Startup Data Flow

```
localStorage.getItem('wpa_jwt')
  ├── null → status='guest', no API call
  └── token → status='checking'
        └── GET /auth/me
              ├── 200 → user = { ...data, id: data.sub }, status='authed'
              └── error → logout() → token cleared, status='guest'
```

### QR Scan & Admission Data Flow

```
Admin scans QR code
  └── QR URL: {PUBLIC_URL}/guest?t=<guestToken>
        ├── If admin already logged in:
        │     POST /auth/guest-info { token }
        │       → GuestInfo { id, name, admissionStatus, admittedAt, avatarUrl }
        │       → navigate('/qr/validate/:guestId', { state: { guestInfo } })
        │
        └── QRValidate.tsx mounts:
              └── GET /users/:guestId  (getGuestAdmission)
                    → UserDto with admissionStatus
                    → ringState = 'pending' | 'already_admitted'
              └── [Admin taps "Admit"]
                    └── POST /users/:guestId/admit
                          → { id, admissionStatus: 'admitted', admittedAt }
                          → ringState = 'just_admitted'
```

### Guest Token Flow

```
AdminPanel creates guest:
  POST /users/guests { name }
    → UserDto { guestToken: '<64-char hex>' }
    → QrCell renders QR code for URL: {PUBLIC_URL}/guest?t={guestToken}
    → Admin downloads or copies the link

Guest scans QR:
  Browser opens /guest?t=<token>
    → GuestLanding.tsx calls guestLogin(token)
    → POST /auth/guest { token }
    → { accessToken, user } stored in localStorage
    → navigate('/welcome')
```

---

## Component Reference

### `App.tsx`

Root route switcher. Reads `status` and `isAdmin` from `useAuth()` to guard routes.
Shows a centered spinner while `status === 'checking'`.

---

### `Login.tsx`

Admin-only login form. Collects email + password, calls `useAuth().login()`.
Displays branded header (couple names from `brand.ts`).

---

### `GuestLanding.tsx`

Landing page for the `/guest?t=<token>` URL.
- Reads `?t=` from search params.
- Calls `guestLogin(token)` on mount (guarded by `tried` ref to prevent double-call in StrictMode).
- If admin is already logged in and a token is present → calls `getGuestInfo(token)` and redirects to the QR validation screen.
- Shows spinner while logging in; shows error if token is missing or invalid.

---

### `GuestWelcome.tsx`

Post-login welcome screen for guests.
- Shows couple branding, guest's name, and an avatar upload widget.
- "View Gallery" button → navigate to `/`.
- "My Photos" / "Coming Soon" button — enabled or disabled by `user.buttonEnabled`.
  - When enabled, navigates to `/?myAlbum=true` (note: the gallery does not currently filter by this param — it's a placeholder route).

---

### `Header.tsx`

Top navigation bar shown on the Gallery page.
- Displays couple names and total photo count (passed down from `Gallery` via `onTotal`).
- "Add photos" button → opens `UploadPanel`.
- "Guests" button (admin only) → navigate to `/admin`.
- Refresh icon → calls `onRefresh` (triggers `POST /photos/refresh` via `useRefresh()`).
- Sign out icon → calls `useAuth().logout()`.

---

### `Gallery.tsx`

Main photo gallery with infinite scroll.
- Calls `usePhotos()` infinite query (page size 24).
- Groups photos by `uploaderId` into `UploaderGroup[]`, sorted newest-first.
- Admins see all groups; guests see only their own group (filtered by `user.id`).
- Each group shows up to 3 photo tiles; "See N more" button navigates to `/gallery/uploader/:uploaderId`.
- `IntersectionObserver` on a sentinel `<div>` triggers `fetchNextPage()`.
- Opens `Lightbox` on tile click.

Also exports `Masthead` — the hero section with couple names, date, and tagline.

---

### `PhotoTile.tsx`

Individual photo/video tile in the masonry grid.
- Renders `<img>` for images (`rawSrc(id, 'w700')`) or `<video>` for video files.
- Retry logic: on image load error, retries up to 4 times with a 4-second delay (appends `&r=N` cache-bust param).
- After 4 failed retries, shows an `ImageOff` placeholder.
- Keyboard accessible (`role="button"`, Enter/Space to open lightbox).
- Lazy loads images via `loading="lazy"`.

---

### `Lightbox.tsx`

Full-screen photo/video viewer.
- Keyboard navigation: `←`/`→` arrows to navigate, `Escape` to close.
- Preloads adjacent images (`index ± 1`) for smooth navigation.
- Shows filename/description, creation date, and current position counter.
- Download button links directly to `/photos/:id/raw?size=download`.
- Renders `<video controls autoPlay>` for video files.

---

### `UploadPanel.tsx`

Slide-up modal for uploading photos/videos.
- Supports drag-and-drop and file picker.
- Accepts `image/*` and `video/*` MIME types; up to 200 files, max 200 MB each.
- Deduplicates files by name + size on add.
- Shows thumbnail previews (image) or icon placeholders (video).
- Optional caption/description field (max 1000 chars).
- Progress bar powered by Axios `onUploadProgress`.
- Routes to single or bulk endpoint depending on file count.

---

### `AdminPanel.tsx`

Guest management dashboard (admin only).
- Loads all users via `GET /users`, separates guests from admins.
- **Create guest form**: `POST /users/guests { name }` → shows new guest row instantly via `reload()`.
- **UserRow** per user:
  - `UserAvatar`: click-to-upload avatar via `PATCH /users/:id/avatar`.
  - QR code canvas rendered with `qrcode` library (160px in-page, 512px on download).
  - Copy-link button writes `{PUBLIC_URL}/guest?t={token}` to clipboard.
  - Toggle button: `PATCH /users/guests/:id/button { enabled }`.
  - Delete button: `DELETE /users/guests/:id` with confirm dialog.
  - Admission chip: shows "Admitted" or "Pending" badge.

---

### `UploaderPage.tsx`

Per-uploader photo view at `/gallery/uploader/:uploaderId`.
- Uses the same `usePhotos()` infinite query; filters client-side by `uploaderId`.
- Special ID `_uncredited_` maps to `uploaderId === null` (photos with no uploader).
- Auth guard: if the logged-in user is not an admin and the `uploaderId` doesn't match their own ID, redirects to `/`.
- Full infinite scroll with sentinel observer.

---

### `QRValidate.tsx`

Entrance scan screen at `/qr/validate/:guestId`.
- Fetches guest admission status via `GET /users/:guestId` on mount.
- Four ring states: `loading`, `pending`, `just_admitted`, `already_admitted`.
- "Admit to Event" button calls `POST /users/:guestId/admit`.
- Displays avatar with animated overlay (green check for admitted, red X for duplicate scan).
- If already admitted, shows how long ago they entered using `timeAgo()`.

---

### `AuthContext.tsx`

React context providing:

| Value | Type | Description |
|---|---|---|
| `user` | `AuthUser \| null` | Current user object |
| `status` | `'checking' \| 'authed' \| 'guest'` | Auth state |
| `login(email, pw)` | `Promise<AuthUser>` | Admin login |
| `guestLogin(token)` | `Promise<AuthUser>` | Guest QR login |
| `logout()` | `void` | Clears token + user |
| `isAdmin` | `boolean` | `role === 'admin' \| 'super_admin'` |

---

## State Management

### Server State (React Query)

| Query Key | Hook | Endpoint | Stale Time |
|---|---|---|---|
| `['photos', 24]` | `usePhotos()` | `GET /photos` | 60 seconds |

| Mutation | Hook | Endpoint | On Success |
|---|---|---|---|
| Upload | `useUpload(onProgress)` | `POST /photos/upload` or `POST /photos/upload/bulk` | Invalidates `['photos', 24]` |
| Refresh | `useRefresh()` | `POST /photos/refresh` | Invalidates `['photos', 24]` |

### Client State

| Component | State | Purpose |
|---|---|---|
| `AuthContext` | `user`, `status` | Global auth user |
| `useToast` | `toasts[]` | Global notification stack |
| `App / GalleryPage` | `uploadOpen` | Controls UploadPanel visibility |
| `Gallery` | `lightbox` | Controls Lightbox with photo list + index |
| `UploaderPage` | `lightbox` | Same, scoped to uploader's photos |
| `UploadPanel` | `files`, `progress`, `over` | Upload queue state |
| `AdminPanel` | `users`, `loading`, `name`, `busy` | Guest list + form state |
| `QRValidate` | `guestInfo`, `ringState`, `admitting` | QR scan result |

---

## User Journey Flows

### Admin Journey

```
1. Open app → /
   └── No token in localStorage → Login.tsx shown

2. Enter email + password → POST /auth/login
   └── Token stored in localStorage
   └── Redirect to / (GalleryPage)

3. Gallery loads → GET /photos?page=1&pageSize=24
   └── Photos grouped by uploader, sorted newest-first
   └── Admin sees ALL uploader groups

4. Add photos:
   Header "Add photos" → UploadPanel
   └── Drag/drop or pick files
   └── Optional caption
   └── POST /photos/upload  (1 file)
       POST /photos/upload/bulk (2+ files)
   └── Gallery auto-refetches on success

5. Re-sync album:
   Header refresh icon → POST /photos/refresh
   └── Backend drops cache, re-fetches from Google Photos
   └── Gallery auto-refetches

6. Manage guests:
   Header "Guests" → /admin (AdminPanel)
   └── GET /users → guest list + admin list

   Create guest:
   └── Enter name → POST /users/guests { name }
   └── QR code rendered in-page
   └── Download (512px PNG) or Copy link

   Per guest row:
   ├── Upload avatar → PATCH /users/:id/avatar
   ├── Toggle second button → PATCH /users/guests/:id/button
   └── Delete guest → DELETE /users/guests/:id

7. View uploader's photos:
   Gallery "See N more" → /gallery/uploader/:uploaderId
   └── Filtered view of that guest's uploads
   └── Infinite scroll, lightbox on click

8. Sign out:
   Header logout icon → tokenStore.clear() → status='guest' → Login shown
```

---

### Guest Journey

```
1. Receive QR code from admin (printed or shared link)
   QR encodes: {PUBLIC_URL}/guest?t=<64-char-hex-token>

2. Scan QR / open link → /guest?t=<token>
   └── GuestLanding.tsx
   └── POST /auth/guest { token }
   └── Token stored in localStorage
   └── Redirect to /welcome (GuestWelcome)

3. GuestWelcome screen:
   └── Upload profile photo (optional):
       Click avatar → POST /users/me/avatar
   └── "View Gallery" → /

4. Gallery (/):
   └── GET /photos?page=1&pageSize=24
   └── Guest sees ONLY their own uploader group
       (filtered by user.id === photo.uploaderId)
   └── If no photos yet: "You haven't added any photos yet" empty state

5. Add photos:
   "Add photos" button → UploadPanel
   └── Same flow as admin (single or bulk upload)

6. View their photos:
   "See N more" → /gallery/uploader/:id
   └── Their full photo collection
   └── IntersectionObserver infinite scroll
   └── Click tile → Lightbox (navigate, download)

7. "My Photos" button (GuestWelcome):
   └── If buttonEnabled=false: button shows "Coming Soon" + locked icon, disabled
   └── If buttonEnabled=true: navigates to /?myAlbum=true
       (NOTE: gallery does not currently filter by this param — it shows the same view)

8. Session persists until:
   └── Logout click, or
   └── JWT expires (7 days default), or
   └── Guest logs in on another device (backend invalidates previous jti)
       → 401 → wpa:unauthorized event → auto-logout
```

---

### QR Entrance Scan Journey

```
Scenario: Admin at event entrance uses their device to scan guest QR codes

1. Admin is logged in (role: admin or super_admin)

2. Guest presents QR code → Admin scans it
   QR URL: {PUBLIC_URL}/guest?t=<token>

3. GuestLanding.tsx detects admin is already authed:
   └── POST /auth/guest-info { token }
         → GuestInfo { id, name, admissionStatus, admittedAt, avatarUrl }
   └── navigate('/qr/validate/:guestId', { state: { guestInfo } })

4. QRValidate.tsx mounts:
   └── GET /users/:guestId → fresh admission status
   └── Determines ringState:
       ├── admissionStatus === 'pending'   → ringState = 'pending'
       └── admissionStatus === 'admitted'  → ringState = 'already_admitted'

5a. Guest not yet admitted (ringState = 'pending'):
    └── Shows guest avatar + name + "Valid guest — not yet admitted"
    └── Admin taps "Admit to Event"
    └── POST /users/:guestId/admit
    └── ringState = 'just_admitted'
    └── Green checkmark overlay, "Welcome to the wedding!" message

5b. Guest already admitted (ringState = 'already_admitted'):
    └── Shows red X overlay
    └── "Already admitted — entered X minutes ago — QR re-use detected"
    └── No admit button shown

6. Admin taps "Back to guest list" → /admin
```

---

## API Implementation Gap Analysis

This section cross-references the frontend implementation against `docs/api.md`.

### ✅ Fully Implemented

| Endpoint | Frontend Feature |
|---|---|
| `POST /auth/login` | Admin login form |
| `POST /auth/guest` | Guest QR login |
| `GET /auth/me` | Session restore on startup |
| `POST /auth/guest-info` | Admin QR scanner redirect in GuestLanding |
| `GET /users` | Admin panel guest/admin list |
| `GET /users/:id` | QR validate admission status fetch |
| `POST /users/guests` | Create guest form |
| `DELETE /users/guests/:id` | Delete guest button |
| `PATCH /users/guests/:id/button` | Toggle second button |
| `POST /users/me/avatar` | Guest self-avatar upload in GuestWelcome |
| `PATCH /users/:id/avatar` | Admin sets user avatar in AdminPanel |
| `GET /users/:id/avatar` | Avatar display everywhere (via `avatarSrc()`) |
| `POST /users/:id/admit` | Admit button in QRValidate |
| `GET /photos` | Gallery + UploaderPage infinite scroll |
| `POST /photos/upload` | Single file upload |
| `POST /photos/upload/bulk` | Multi-file upload |
| `POST /photos/refresh` | Admin re-sync button |
| `GET /photos/:id/raw` | All image/video display + download links |

---

### ❌ Not Implemented (API exists, no UI)

| Endpoint | Notes |
|---|---|
| `POST /auth/admins` | Create admin account — no UI. Only a super_admin can call this. Would need a form in AdminPanel or a separate settings screen. |
| `GET /auth/admins` | List admin accounts — no dedicated UI. AdminPanel shows admins via `GET /users` filtered by role, but doesn't show full admin metadata (createdAt, isActive). |
| `POST /users/admins` | Create admin (users route) — duplicate of `/auth/admins`, also not implemented. |
| `DELETE /users/admins/:id` | Delete admin account — no UI. |
| `GET /photos/:id` | Fetch single photo DTO — never used. Frontend always works from the paginated list. |
| `GET /google/auth-url` | Google OAuth setup — server setup tool, no frontend UI needed. |
| `GET /google/callback` | Google OAuth callback — server-side only. |

---

### ⚠️ Partially Implemented / Has Gaps

| Feature | Current State | Gap |
|---|---|---|
| **"My Photos" button** | GuestWelcome navigates to `/?myAlbum=true` when `buttonEnabled=true` | The Gallery page does not read the `myAlbum` query param. The guest sees all their photos (same as normal view) rather than any special "my album" filtered experience. |
| **Admin account management** | AdminPanel shows admin rows in the user list (read-only) | No create/delete admin UI. No isActive toggle. |
| **Admission status on guest list** | Shows Admitted/Pending chip in UserRow | Admission timestamp (`admittedAt`) is not shown in the guest list — only visible in QRValidate. |
| **Photo description in gallery** | `PhotoTile` shows `description \|\| filename \|\| 'Untitled'` | No way for uploader to edit a description after upload. Description field only available at upload time. |
| **Pagination params** | `GET /photos` uses `refresh=false` (never passes `refresh=true` as query param) | The refresh is done via the dedicated `POST /photos/refresh` mutation instead. Both approaches achieve the same result. |

---

## Known Limitations & TODOs

### Functional Gaps

1. **No admin creation UI** — To create a new admin, you must call `POST /auth/admins` directly (e.g., via Swagger or curl). There is no frontend form for this.

2. **No admin deletion UI** — `DELETE /users/admins/:id` is not surfaced in the UI.

3. **"My Photos" button does nothing unique** — `buttonEnabled=true` routes to `/?myAlbum=true` but the Gallery ignores `myAlbum`. The intent appears to be a filtered personal album view, but it's not wired up.

4. **Guests can see photos from ALL guests in UploaderPage** — `UploaderPage.tsx` is protected by `isAdmin || user?.id === resolvedId`, so guests can only access their own uploader page. However, the data is fetched from the shared `usePhotos()` query which pulls the full album. A determined guest who knew another guest's UUID could still trigger their own query. This is a client-side-only guard.

5. **No offline / error recovery for uploads** — If an upload fails midway, the user must re-select all files. There is no retry queue.

6. **QR scanner is manual** — The QR validation flow assumes the admin manually navigates to a URL. There is no camera-based QR scanner integration. The admin must use a phone's native QR scanner which opens the browser to the guest URL.

7. **No real-time updates** — The gallery does not poll or use WebSockets. New photos uploaded by other users do not appear until the admin hits the refresh button or the React Query stale time (60s) elapses.

8. **Toasts / `Toasts.tsx`** — The toast system is implemented and works, but there is no `useToast.tsx` component reference in the documentation above. The `ToastProvider` in `main.tsx` wraps the app. Toasts are triggered with `toast.ok()`, `toast.err()`, and `toast.info()` from `useToast()`.

### Code Quality Notes

- `AdminPanel.tsx` uses a custom `useUsers()` hook that does raw `api.get` instead of React Query — meaning the guest list has no caching and always refetches on `reload()`. This is a deliberate simplicity choice but could be migrated to React Query.
- `UploaderPage.tsx` filters photos client-side from the already-loaded React Query cache rather than calling a dedicated per-uploader API endpoint. This works but means all pages must be loaded before a complete per-uploader count is known.
- The `brand.ts` module parses `VITE_COUPLE_NAMES` at module load time. If the env var is missing, it falls back to `'Amara & Sefu'`.

---

## Quick Reference: URL Patterns

| URL | Viewer | Notes |
|---|---|---|
| `http://localhost:5173/` | Gallery (admin or guest) | Home |
| `http://localhost:5173/guest?t=<token>` | GuestLanding | QR code target |
| `http://localhost:5173/welcome` | GuestWelcome | Post-login landing for guests |
| `http://localhost:5173/admin` | AdminPanel | Guest management |
| `http://localhost:5173/gallery/uploader/<uuid>` | UploaderPage | Per-guest photo view |
| `http://localhost:5173/gallery/uploader/_uncredited_` | UploaderPage | Photos with no uploader |
| `http://localhost:5173/qr/validate/<guestId>` | QRValidate | Entrance admission screen |

---

*This document was generated by analyzing the full source tree of `WeddingAppFrontend` and cross-referenced against `docs/api.md`.*
