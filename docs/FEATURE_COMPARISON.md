# Feature Comparison: WeddingAppFrontend vs Emmilove
## + Supabase → Custom API Migration Analysis

> Generated: July 2026

---

## Table of Contents

1. [High-Level Summary](#high-level-summary)
2. [Side-by-Side Feature Matrix](#side-by-side-feature-matrix)
3. [What Emmilove Has That WeddingAppFrontend Doesn't](#what-emmilove-has-that-weddingappfrontend-doesnt)
4. [What WeddingAppFrontend Has That Emmilove Doesn't](#what-weddingappfrontend-has-that-emmilove-doesnt)
5. [Shared Features — Implementation Differences](#shared-features--implementation-differences)
6. [Supabase Services Used in Emmilove](#supabase-services-used-in-emmilove)
7. [Which Supabase Services the Custom API Replaces](#which-supabase-services-the-custom-api-replaces)
8. [What Supabase Services the Custom API Does NOT Cover](#what-supabase-services-the-custom-api-does-not-cover)
9. [Migration Mapping: Supabase → Custom API](#migration-mapping-supabase--custom-api)
10. [Effort Estimate for Integration](#effort-estimate-for-integration)

---

## High-Level Summary

| Aspect | WeddingAppFrontend | Emmilove |
|---|---|---|
| **Purpose** | Photo album for the wedding day | Full wedding website + crowd-sourced memory gallery |
| **Backend** | Custom NestJS API (JWT auth, Google Photos) | Supabase (Postgres + Storage + Edge Function) |
| **Auth model** | JWT tokens (admin email/password, guest QR code) | No auth — fully anonymous public access |
| **Photo source** | Google Photos Library API | Supabase Storage (direct upload) |
| **Moderation** | No moderation — all uploads go live instantly | Pending → Admin review → Approved/Rejected |
| **Guests** | Named guests with unique QR tokens | Anonymous (optional name at upload time) |
| **Couple UI** | Admin panel manages guests | Admin panel publishes own photos |
| **Deployment** | Vite dev/build (no deploy config) | Vercel |
| **Styling** | Custom CSS (CSS variables) | Tailwind CSS + shadcn/ui |
| **Animations** | Framer Motion | Tailwind custom animations |

---

## Side-by-Side Feature Matrix

| Feature | WeddingAppFrontend | Emmilove |
|---|---|---|
| **Landing / Hero page** | Login screen only | Full hero with couple names, proposal photo |
| **Love story section** | ❌ | ✅ ("Our Story" with chapters) |
| **Proposal section** | ❌ | ✅ (dedicated section) |
| **Wedding date / countdown** | ❌ | ✅ (placeholder, not yet wired) |
| **RSVP form** | ❌ | ✅ (UI only — not saved to DB) |
| **Gift registry section** | ❌ | ✅ (UI only — cosmetic) |
| **Video section** | ❌ | ✅ (local video asset) |
| **Static proposal gallery** | ❌ | ✅ (6 local images, lightbox) |
| **Dark / light mode** | ❌ | ✅ |
| **Mobile nav hamburger** | ❌ | ✅ |
| **Photo gallery (shared album)** | ✅ | ✅ (different implementation) |
| **Video support in gallery** | ✅ | ✅ |
| **Infinite scroll / pagination** | ✅ (infinite, page size 24) | ✅ (manual "Load more", page size 20) |
| **Lightbox / photo viewer** | ✅ | ✅ |
| **Touch swipe in lightbox** | ❌ | ✅ |
| **Photo upload (guests)** | ✅ | ✅ |
| **Bulk / album upload** | ✅ (up to 200 files) | ✅ (up to 30 files for guests, 50 for couple) |
| **Upload progress bar** | ✅ | ✅ |
| **Image compression before upload** | ❌ | ✅ (browser-image-compression) |
| **Upload moderation / approval** | ❌ (instant) | ✅ (pending → approve/reject) |
| **Couple-specific uploads** | ❌ | ✅ (Crown badge, auto-approved) |
| **Like / react to photos** | ❌ | ✅ (localStorage only) |
| **Filter by type (photo/video/album)** | ❌ | ✅ |
| **Filter "Ours" (couple content)** | ❌ | ✅ |
| **Per-uploader view** | ✅ (`/gallery/uploader/:id`) | ❌ |
| **Admin panel (guest management)** | ✅ | ❌ |
| **Admin panel (moderation)** | ❌ | ✅ |
| **QR code generation** | ✅ | ❌ |
| **QR code download** | ✅ | ❌ |
| **Guest admission / entrance scan** | ✅ (QR validate) | ❌ |
| **User avatars** | ✅ | ❌ |
| **Named guest accounts** | ✅ (QR login) | ❌ |
| **Role-based access (admin/guest/super_admin)** | ✅ | ❌ |
| **Download photo (lightbox)** | ✅ | ✅ |
| **Album re-sync from Google** | ✅ | ❌ |
| **Branding via env vars** | ✅ (couple names, date, tagline) | ✅ (hardcoded in component files) |
| **RSVP saved to backend** | ❌ | ❌ (both are unimplemented) |

---

## What Emmilove Has That WeddingAppFrontend Doesn't

These are **features unique to emmilove** that would need to be built if you merged the two:

1. **Full wedding website** — Hero, Story, Proposal, Details, RSVP, Gift, Footer. WeddingAppFrontend is only a photo album, not a wedding invitation site.

2. **Upload moderation workflow** — pending → approve → reject pipeline with admin dashboard. WeddingAppFrontend publishes all uploads instantly.

3. **Couple-sourced content** — Admins can publish couple photos that display with a crown badge and sort to the top of the gallery, clearly distinguished from guest uploads.

4. **Content filtering** — Gallery can be filtered by type (photos, videos, albums) and by source (couple's own vs guests).

5. **Image compression before upload** — Emmilove uses `browser-image-compression` to compress images client-side (max 1 MB, 2000px) before uploading. WeddingAppFrontend sends files as-is.

6. **Album type** — Emmilove supports named albums (multi-photo collections with a title). WeddingAppFrontend groups photos by uploader, not by explicit album.

7. **Like/react system** — Per-upload heart button (localStorage-persisted). Not in WeddingAppFrontend.

8. **Anonymous upload toggle** — Guests can choose to share a memory without their name. WeddingAppFrontend names all photos by uploader.

9. **Touch swipe in lightbox** — Mobile-friendly swipe gestures for navigating photos.

10. **Dark / light mode toggle** — Full theming support via next-themes.

11. **Vercel deployment config** — `vercel.json` is present and configured.

---

## What WeddingAppFrontend Has That Emmilove Doesn't

These are features **unique to WeddingAppFrontend**:

1. **Named guest accounts with QR login** — Each guest has a unique token; scanning their personal QR code signs them in. Emmilove has no concept of individual guests.

2. **Entrance admission / QR validation** — Admin can scan a guest's QR at the door to admit them; tracks admission status and timestamp. Emmilove has no event entrance flow.

3. **Role-based access control** — `GUEST`, `ADMIN`, `SUPER_ADMIN` roles with different permissions. Emmilove's only "role" is knowing the admin password.

4. **Per-uploader gallery page** — `/gallery/uploader/:id` shows all photos from a specific uploader in a dedicated masonry view.

5. **User avatars** — Both guests and admins can have a profile photo (upload their own or admin sets it).

6. **Google Photos integration** — Photos are stored in a real Google Photos album, not just a file storage bucket. Supports original-quality downloads via Google.

7. **Album re-sync** — Admin can force a re-sync from Google Photos to pick up manually added photos.

8. **Guest management UI** — Admin can create, delete, and manage named guests; toggle per-guest feature flags (`buttonEnabled`).

9. **JWT-based auth** — Proper stateless auth with token refresh on startup and automatic logout on 401.

---

## Shared Features — Implementation Differences

### Photo Gallery

| Aspect | WeddingAppFrontend | Emmilove |
|---|---|---|
| Data source | NestJS API → Google Photos | Supabase `uploads` + `media` tables |
| Grouping | By uploader (React Query infinite) | By upload record, flat masonry |
| Pagination | Infinite scroll (IntersectionObserver, page 24) | Manual "Load more" button (page 20) |
| Admin vs guest view | Admins see all groups; guests see only their own | Everyone sees the same approved content |
| Photo URL | `/photos/:id/raw` redirect → Google URL | Direct Supabase Storage public URL |
| URL stability | Stable (backend proxies fresh Google URL) | Stable (public bucket URL never expires) |

### Upload Flow

| Aspect | WeddingAppFrontend | Emmilove |
|---|---|---|
| Max files | 200 | 30 (guest), 50 (couple) |
| Compression | None | Yes (images: max 1 MB, 2000px) |
| Storage | Google Photos API | Supabase Storage (`memories` bucket) |
| Moderation | None — live immediately | Pending until admin approves |
| Description | Single caption for all files | Per-upload caption + optional album title |

### Lightbox

| Aspect | WeddingAppFrontend | Emmilove |
|---|---|---|
| Keyboard nav | ✅ | ✅ |
| Touch swipe | ❌ | ✅ |
| Download | ✅ (direct link to `/photos/:id/raw?size=download`) | ✅ (fetches blob + triggers download) |
| Caption | Shows filename or description | Shows caption + author name |
| Preloading | ✅ (preloads adjacent images) | ❌ |

### Admin / Moderation

| Aspect | WeddingAppFrontend | Emmilove |
|---|---|---|
| Auth | JWT (email + password via API) | Password → Edge Function (sessionStorage) |
| Guest list | ✅ Full CRUD | ❌ Not applicable |
| Moderation queue | ❌ | ✅ (pending / approved / rejected tabs) |
| QR code tools | ✅ | ❌ |
| Couple uploads | ❌ | ✅ |

---

## Supabase Services Used in Emmilove

Emmilove uses three Supabase services:

### 1. Supabase Database (PostgreSQL via PostgREST)

Used for all structured data:

| SDK Method | Tables | Used by |
|---|---|---|
| `.from("uploads").select(...)` | `uploads` + `media` (joined) | `Moments.tsx`, `AdminMoments.tsx` |
| `.from("uploads").insert(...)` | `uploads` | `UploadModal.tsx`, `CoupleUploadModal.tsx` |
| `.from("media").insert(...)` | `media` | `UploadModal.tsx`, `CoupleUploadModal.tsx` |
| `.from("uploads").update({ status })` | `uploads` | Edge Function only |
| `.from("uploads").select(...).eq("source","couple")` | `uploads` | `AdminMoments.tsx` |

### 2. Supabase Storage

Used for storing photo and video files:

| SDK Method | Bucket | Used by |
|---|---|---|
| `.storage.from("memories").upload(path, blob)` | `memories` | `UploadModal.tsx`, `CoupleUploadModal.tsx` |
| `.storage.from("memories").getPublicUrl(path)` | `memories` | `UploadModal.tsx`, `CoupleUploadModal.tsx` |

Files are publicly accessible via Supabase CDN URLs (permanent, no expiry). Format: `https://<project>.supabase.co/storage/v1/object/public/memories/{upload_id}/{ts}-{i}.{ext}`

### 3. Supabase Edge Functions (Deno)

One custom function for admin operations:

| Function | URL | Auth | Actions |
|---|---|---|---|
| `moments-admin` | `.../functions/v1/moments-admin` | Custom password header | `list` (by status), `moderate` (approve/reject) |

Uses `SUPABASE_SERVICE_ROLE_KEY` internally to bypass RLS for admin reads/writes.

---

## Which Supabase Services the Custom API Replaces

The custom NestJS backend (`docs/api.md`) is a **full-featured wedding backend**. Here's which Supabase services it already replaces and which ones it would need to absorb:

### ✅ Already Replaced — Supabase Database (uploads + media tables)

The custom API has a complete **users + photos** data model:
- `users` table → replaces Supabase `uploads` table (for named guest accounts)
- `photos` table → replaces Supabase `media` table (for photo metadata)
- The custom API handles all CRUD for these via NestJS + TypeORM (SQLite or Postgres)

**What the custom API does NOT have** (from emmilove's schema):
- `upload.status` (pending/approved/rejected) — no moderation concept
- `upload.source` (guest/couple) — no couple-sourced content
- `upload.album_title` — no named album concept
- `upload.is_anonymous` — all photos are attributed to the uploader

### ✅ Already Replaced — Supabase Auth (partially)

The custom API has its own JWT system:
- `POST /auth/login` (admin) — replaces Supabase `signInWithPassword()`
- `POST /auth/guest` (QR) — replaces any Supabase Auth anon flow
- `GET /auth/me` — replaces Supabase `getUser()`

Emmilove doesn't actually use Supabase Auth for login — it uses anonymous access. The custom API's auth is more fully featured.

### ✅ Already Replaced — Supabase Edge Function (moments-admin)

The custom API has equivalents:
- `GET /users` with `status` filtering = replaces `action: "list"` in edge function
- Admin updating upload status = replaces `action: "moderate"` in edge function
- Custom API uses Role Guard + JWT instead of a shared password

### ❌ NOT Replaced — Supabase Storage

This is the **key gap**. The custom API uses **Google Photos** for media storage, not a file storage bucket. This means:

| Supabase Storage feature | Custom API equivalent |
|---|---|
| `storage.upload(path, blob)` | `POST /photos/upload` or `POST /photos/upload/bulk` |
| `storage.getPublicUrl(path)` | `/photos/:id/raw` (proxies Google URL) |
| Permanent public CDN URL | ❌ Google URLs expire after 60 min (custom API handles refresh transparently) |
| Storage bucket (any file type) | Google Photos (images and videos only, no arbitrary files) |

**The custom API DOES have file upload endpoints** — they just go to Google Photos instead of Supabase Storage. So the storage layer is replaced by a different provider, not eliminated.

---

## What Supabase Services the Custom API Does NOT Cover

If you want to port emmilove's features into the custom API, these are the **gaps to fill**:

### 1. Upload Moderation (status field)

Emmilove's `uploads.status` (`pending` / `approved` / `rejected`) has no equivalent in the custom API.

The custom API would need:
- A `status` field on the photos table (`pending`, `approved`, `rejected`)
- `PATCH /photos/:id/status` endpoint (admin only)
- `GET /photos` to respect status filter (only return `approved` by default)
- A moderation dashboard (currently shows no moderation UI)

### 2. Anonymous Uploads

Emmilove allows uploading without logging in. The custom API requires a JWT for all photo uploads.

The custom API would need:
- A public `POST /photos/upload` endpoint (no auth) OR
- A guest "one-time token" flow that doesn't require a pre-registered account

### 3. Named Albums

Emmilove has `type: 'album'` with an `album_title`. The custom API groups photos by uploader, not by explicit album. Adding album support would require:
- New `albums` table / concept
- `POST /albums`, `GET /albums/:id`, `DELETE /albums/:id`
- Photo-to-album relationship

### 4. Couple-Source Content

Emmilove distinguishes `source: 'couple'` vs `source: 'guest'` to display couple photos with a Crown badge and sort them to the top. The custom API has no equivalent — all photos are equal.

### 5. Like / React System

Emmilove's like counter (even though localStorage-only) has no API equivalent. A real implementation would need:
- A `likes` table or `like_count` column on photos
- `POST /photos/:id/like`, `DELETE /photos/:id/like`

---

## Migration Mapping: Supabase → Custom API

This table maps every Supabase call in emmilove to its equivalent in the custom NestJS API:

| Emmilove (Supabase) | Custom API Equivalent | Gap? |
|---|---|---|
| `supabase.from("uploads").select(...).eq("status","approved")` | `GET /photos?page=N&pageSize=N` | ⚠️ Custom API has no `status` filter — returns all photos |
| `supabase.from("uploads").insert({ type, user_name, ... })` | No direct equivalent — upload is atomic in `POST /photos/upload` | ⚠️ Custom API combines upload record + file in one request |
| `supabase.storage.from("memories").upload(path, blob)` | `POST /photos/upload` (file in FormData) | ✅ Covered — different storage backend (Google) |
| `supabase.storage.from("memories").getPublicUrl(path)` | `GET /photos/:id/raw` | ✅ Covered — proxies Google URL |
| `supabase.from("media").insert({ upload_id, file_url, type })` | Handled internally by `POST /photos/upload` | ✅ Covered internally |
| `supabase.from("uploads").update({ status }).eq("id", id)` | No equivalent — `PATCH /photos/:id/status` doesn't exist | ❌ Missing — needs new endpoint |
| Edge Function `action: "list"` | `GET /photos?status=pending` | ⚠️ Endpoint exists but no status filter |
| Edge Function `action: "moderate"` | ❌ Not implemented | ❌ Missing |
| `supabase.from("uploads").eq("source","couple")` | ❌ No couple/guest distinction | ❌ Missing |

---

## Effort Estimate for Integration

If the goal is to **replace Supabase in emmilove with the custom NestJS API**, here is what's needed:

### Low Effort (already mostly done)

- Replace `supabase.storage.upload()` with `POST /photos/upload` — the API already accepts multipart
- Replace `supabase.storage.getPublicUrl()` with `/photos/:id/raw` calls
- Replace Supabase client reads with `GET /photos` calls (React Query)
- Guest login using QR or anonymous token instead of Supabase anon role

### Medium Effort (new features needed in the API)

- Add `status` field to photos model (`pending`, `approved`, `rejected`)
- Add `PATCH /photos/:id/status` endpoint (admin only)
- Add `source` field to photos (`couple`, `guest`)
- Add anonymous upload support (no JWT required, or a public guest token)
- Add `GET /photos?status=pending` filter to the list endpoint

### High Effort (new concepts not in the current API)

- Named albums (`album_title`) — new table + relationships + endpoints
- Couple-specific upload flow with auto-approval
- Admin moderation dashboard (frontend) in WeddingAppFrontend
- Image compression (currently not done in WeddingAppFrontend — can add client-side with `browser-image-compression`)
- Like system (optional — could stay localStorage-only)
- Wedding website sections (Hero, Story, RSVP, etc.) — entirely new pages in WeddingAppFrontend

### Not Needed (already covered better)

- Authentication → WeddingAppFrontend's JWT system is more robust than emmilove's password-in-sessionStorage
- Guest management → WeddingAppFrontend already has full CRUD for named guests
- QR entrance scanning → WeddingAppFrontend already has this; emmilove doesn't

---

*Cross-reference sources: `docs/api.md`, `src/` (WeddingAppFrontend), `emmilove/src/` and `emmilove/supabase/`*
