# Emmilove — Frontend Documentation

> Wedding invitation & shared memories app built with React + Vite + Supabase
> Generated: July 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Environment Variables](#environment-variables)
4. [Application Architecture](#application-architecture)
5. [Routing](#routing)
6. [Supabase Integration](#supabase-integration)
7. [Database Schema](#database-schema)
8. [All Supabase API Calls](#all-supabase-api-calls)
9. [Edge Function](#edge-function)
10. [Component Reference](#component-reference)
11. [User Journey Flows](#user-journey-flows)
    - [Wedding Guest (Public Visitor)](#wedding-guest-public-visitor)
    - [Guest Uploading a Memory](#guest-uploading-a-memory)
    - [Admin Moderating Uploads](#admin-moderating-uploads)
    - [Couple Publishing Their Own Photos](#couple-publishing-their-own-photos)
12. [Data Flow](#data-flow)
13. [Authentication Model](#authentication-model)
14. [Known Limitations](#known-limitations)

---

## Overview

Emmilove is a **wedding invitation website** for Emmanuel & Funmilayo. It is a public-facing single-page app that serves as the couple's wedding website, with a built-in crowd-sourced memory gallery called **Moments** where guests can upload their own photos and videos.

Key characteristics:
- **No user accounts** — completely anonymous for public visitors
- **Supabase** as the only backend (database + storage + edge function)
- **Moderation-first** — all guest uploads start as `pending` and must be approved by an admin before appearing publicly
- **Couple uploads** bypass moderation — they are set to `approved` + `source: "couple"` immediately
- Deployed to **Vercel** (`vercel.json` present)

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | React | 18.3 |
| Build tool | Vite + SWC | 5.4 |
| Language | TypeScript | 5.8 |
| Styling | Tailwind CSS | 3.4 |
| UI Components | shadcn/ui (Radix UI) | various |
| Routing | React Router DOM | 6.x |
| Backend / Database | Supabase (`@supabase/supabase-js`) | 2.105 |
| Server state | TanStack React Query | 5.83 |
| Toasts | Sonner | 1.7 |
| Image compression | browser-image-compression | 2.0 |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Animations | Tailwind CSS animations (custom) | — |
| Icons | Lucide React | 0.462 |
| Dark mode | next-themes | 0.3 |
| Testing | Vitest + Testing Library | 3.x |

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Full Supabase project URL, e.g. `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key (safe to expose in browser) |
| `VITE_SUPABASE_PROJECT_ID` | Project ref ID (used to construct Edge Function URL in AdminMoments) |

Active project ref: `dggcxuqadeqsneflleem`

---

## Application Architecture

```
main.tsx
└── App.tsx
    ├── QueryClientProvider (TanStack React Query)
    ├── TooltipProvider (Radix)
    ├── Toaster + Sonner (toast notifications)
    └── BrowserRouter
        ├── / → Index (full wedding site)
        ├── /moments → Moments (guest memory gallery)
        ├── /admin/moments → AdminMoments (moderation dashboard)
        └── * → NotFound
```

The Supabase client is a singleton at `src/integrations/supabase/client.ts`, used directly in components (no custom API layer).

---

## Routing

| Path | Component | Auth | Description |
|---|---|---|---|
| `/` | `Index` | Public | Full wedding website (all sections) |
| `/moments` | `Moments` | Public | Guest-submitted memory gallery |
| `/admin/moments` | `AdminMoments` | Password (session storage) | Moderation dashboard |
| `*` | `NotFound` | Public | 404 page |

Admin auth is a simple password prompt — no JWT, no Supabase Auth. Password is checked against the `MOMENTS_ADMIN_PASSWORD` Supabase secret in the edge function.

---

## Supabase Integration

### Client Setup

`src/integrations/supabase/client.ts`

```ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

Auth persistence is enabled but **Supabase Auth is not used** — the app operates entirely under the `anon` role. All users are anonymous.

---

## Database Schema

Two tables in the `public` schema, created in `supabase/migrations/`:

### `uploads` table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `type` | `text` | — | `'single'` or `'album'` |
| `user_name` | `text` | `null` | Submitter's name (null if anonymous) |
| `is_anonymous` | `boolean` | `false` | Whether to hide name publicly |
| `caption` | `text` | `null` | Optional caption/description |
| `album_title` | `text` | `null` | Album title (only when `type='album'`) |
| `status` | `text` | `'pending'` | `'pending'`, `'approved'`, or `'rejected'` |
| `source` | `text` | `'guest'` | `'guest'` or `'couple'` (added in migration 2) |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |

### `media` table

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `upload_id` | `uuid` | FK → `uploads.id` (cascade delete) |
| `file_url` | `text` | Public URL from Supabase Storage |
| `type` | `text` | `'photo'` or `'video'` |
| `created_at` | `timestamptz` | Creation timestamp |

### Indexes

- `idx_media_upload_id` on `media(upload_id)`
- `idx_uploads_status_created` on `uploads(status, created_at DESC)`

### Row Level Security (RLS)

| Table | Operation | Policy |
|---|---|---|
| `uploads` | `INSERT` | Anyone (anon + authenticated) can insert |
| `uploads` | `SELECT` | Only rows where `status = 'approved'` are visible publicly |
| `media` | `INSERT` | Anyone can insert |
| `media` | `SELECT` | Only media linked to `approved` uploads is visible |

> **Note:** The admin edge function uses the `service_role` key, which bypasses RLS, allowing it to see `pending` and `rejected` uploads.

### Storage

- Bucket: `memories` (public)
- Any anon/authenticated user can upload to this bucket
- Any user can read (public bucket)
- File paths: `{upload_id}/{timestamp}-{index}.{ext}`

---

## All Supabase API Calls

### From `Moments.tsx` (Public Gallery)

| Operation | Table / Service | Query / Method | Details |
|---|---|---|---|
| `SELECT` | `uploads` | `.from("uploads").select("id, type, source, user_name, is_anonymous, caption, album_title, created_at, media(id, file_url, type)")` | Filtered by `status = 'approved'`, ordered by source ASC then `created_at` DESC, paginated with `.range(from, to)` |

This is the only read that guests see. RLS enforces `status = 'approved'` automatically.

---

### From `UploadModal.tsx` (Guest Upload)

**Step 1: Create upload record**

| Operation | Table | Method |
|---|---|---|
| `INSERT` | `uploads` | `.from("uploads").insert({ type, user_name, is_anonymous, caption, album_title }).select().single()` |

Returns the new row's `id` to use as the storage folder name.

**Step 2: Upload file to Storage (per file, looped)**

| Operation | Service | Method |
|---|---|---|
| `UPLOAD` | `storage / memories` | `.storage.from("memories").upload(path, fileBlob, { contentType, upsert: false })` |

- Images are compressed via `browser-image-compression` (max 1 MB, max 2000px) before upload
- Videos are uploaded as-is

**Step 3: Get public URL**

| Operation | Service | Method |
|---|---|---|
| `GET PUBLIC URL` | `storage / memories` | `.storage.from("memories").getPublicUrl(path)` |

**Step 4: Insert media record**

| Operation | Table | Method |
|---|---|---|
| `INSERT` | `media` | `.from("media").insert({ upload_id, file_url, type })` |

Steps 2–4 repeat for each file in the batch (up to 30 files per album upload).

---

### From `CoupleUploadModal.tsx` (Couple Upload — Admin only)

Same flow as guest upload, but with two differences in the `uploads` INSERT:

```ts
status: "approved",  // bypasses moderation
source: "couple",    // marks as couple content
```

This means couple uploads appear in the public gallery immediately.

---

### From `AdminMoments.tsx` (Admin Dashboard)

The admin dashboard does **not** call Supabase directly for moderation. It calls a Supabase **Edge Function** instead (password-authenticated). However, it does call Supabase directly for:

| Operation | Table | Method | Purpose |
|---|---|---|---|
| `SELECT` | `uploads` | `.from("uploads").select(...).eq("status", "approved").eq("source", "couple").order(...)` | Load couple's own gallery |

The `moderate` and `list` actions go through the edge function (see below).

---

## Edge Function

**Function:** `moments-admin`  
**URL:** `https://{VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/moments-admin`  
**Auth:** Custom header `x-admin-password` checked against `MOMENTS_ADMIN_PASSWORD` Supabase secret  
**Runtime:** Deno (Supabase Edge Functions)

### Actions

| Action | Request Body | What it does |
|---|---|---|
| `list` | `{ action: "list", status: "pending" \| "approved" \| "rejected" }` | Returns up to 200 uploads with that status (bypasses RLS via service role key) |
| `moderate` | `{ action: "moderate", id: "<uuid>", status: "approved" \| "rejected" \| "pending" }` | Updates the `status` field of the given upload |

The edge function uses `SUPABASE_SERVICE_ROLE_KEY` (Supabase secret, never exposed to browser), so it can read and update any row regardless of RLS.

---

## Component Reference

### Pages

#### `Index.tsx`
Full wedding website rendered as a single scrollable page. Assembles all wedding sections:
`Nav → Hero → Story → Proposal → Details → Rsvp → Gallery → VideoSection → Gift → Footer`

No API calls. Entirely static/presentational.

---

#### `Moments.tsx`
Public memory gallery at `/moments`. Guests can browse and upload memories.

- Loads approved uploads from Supabase on mount (paginated, 20 per page)
- Filters: All / Ours (couple) / Photos / Albums / Videos
- **Like system**: client-side only, stored in `localStorage` — not persisted to DB
- Click a single/video → opens `Lightbox`
- Click an album → opens inline full-album view
- "Share a Memory" button → opens `UploadModal`
- Couple uploads shown with a Crown badge and sorted first

---

#### `AdminMoments.tsx`
Moderation dashboard at `/admin/moments`. Password-protected.

- Password stored in `sessionStorage` for the browser session
- Calls edge function to `list` uploads by status tab (Pending / Approved / Rejected)
- Per item: Approve or Reject buttons call edge function `moderate` action
- "Our Gallery" section shows couple uploads (read from Supabase directly)
- "Add to Our Gallery" → opens `CoupleUploadModal`
- Full album preview overlay for uploads with >4 media files
- Move-between-statuses available for non-pending tabs

---

### Wedding Section Components (all on `/`)

| Component | Description |
|---|---|
| `Nav` | Fixed top navigation. Hash-link scroll on `/`, router links from other pages. "Moments" pill links to `/moments`. Dark/light toggle. |
| `Hero` | Full-viewport background image with Ken Burns animation, couple names, CTA button |
| `Story` | Three-chapter love story with alternating image/text layout |
| `Proposal` | (Not read in detail, similar layout to Story) |
| `Details` | Save-the-date section with countdown placeholders (`WEDDING_DATE` is currently `null`) |
| `Gallery` | Static grid of 6 proposal photos with lightbox. **Not connected to Supabase.** |
| `VideoSection` | Autoplay muted looping proposal video (local asset) |
| `Rsvp` | RSVP form — **frontend-only, no submission to DB**. Shows a thank-you state on submit. |
| `Gift` | Gift registry section — placeholders, "Send a Gift" button is cosmetic |
| `Footer` | Footer with couple names |

---

### Moments Sub-components

#### `UploadModal.tsx`
Multi-step modal for guest uploads:
1. **Choose**: Single photo/video OR Album
2. **Form**: File picker (drag & drop), caption, name, anonymous toggle
3. **Uploading**: Progress bar (per-file percentage)
4. **Success / Error**

Accepts: `image/jpeg, image/png, image/webp, video/mp4, video/quicktime`
Max files per album: 30
Image compression applied before upload (max 1 MB, max 2000px)

---

#### `CoupleUploadModal.tsx`
Admin-only version of the upload modal. Simpler (no name/anonymous fields).
Auto-sets `status: "approved"` and `source: "couple"` — publishes immediately.
Max files: 50

---

#### `Lightbox.tsx`
Full-screen media viewer:
- Keyboard navigation (← → Esc)
- Touch swipe support (mobile)
- Download button (fetches blob and triggers download)
- Caption and author name display
- Photo count indicator

---

## User Journey Flows

### Wedding Guest (Public Visitor)

```
1. Open / → Index page
   └── Reads couple's story (static)
   └── Proposal section (static)
   └── Details / countdown (static, date TBD)
   └── RSVP form → client-side only thank-you message (NOT saved to DB)
   └── Gallery → static proposal photos
   └── Video section → local video plays
   └── Gift section → cosmetic

2. Click "Moments" in Nav → /moments
   └── GET approved uploads from Supabase
   └── Browse, filter, like (localStorage only)
   └── Click photo/video → Lightbox
   └── Click album → inline album view → Lightbox
   └── "Share a Memory" → UploadModal
```

---

### Guest Uploading a Memory

```
1. Click "Share a Memory" → UploadModal opens

2. Choose: Single Photo/Video OR Album

3. For Album: Enter album title (required)

4. Drag/drop or pick files
   (images compressed automatically)

5. Optional: caption, name (or stay anonymous)

6. Click "Share Memory" / "Share Album"
   a. INSERT to uploads table (status: 'pending')
   b. For each file:
      - Compress image (if applicable)
      - UPLOAD to storage/memories/{upload_id}/{ts}-{i}.{ext}
      - GET public URL
      - INSERT to media table
   c. Progress bar updates per file

7. Success screen: "Your memory has been added 💛"
   "It will appear in the gallery once reviewed."
   → Does NOT appear publicly until admin approves
```

---

### Admin Moderating Uploads

```
1. Open /admin/moments
   └── Password prompt (checked against edge function)

2. Enter password → POST to edge function (action: "list", status: "pending")
   └── Password stored in sessionStorage for the session

3. Review pending uploads (grid view, media preview)

4. Approve → POST edge function (action: "moderate", id, status: "approved")
   → Upload becomes visible in public gallery

5. Reject → POST edge function (action: "moderate", id, status: "rejected")
   → Upload stays hidden from public

6. Switch tabs to see Approved / Rejected
   Can move items between statuses
```

---

### Couple Publishing Their Own Photos

```
1. Admin logs in to /admin/moments

2. "Our Gallery" section → "Add to Our Gallery"
   → CoupleUploadModal opens

3. Optional album title + caption
   Pick files (up to 50)

4. Click "Publish to Gallery"
   a. INSERT to uploads (status: 'approved', source: 'couple')
   b. Upload each file to storage
   c. INSERT to media table
   → Photos appear IMMEDIATELY in public /moments gallery (no moderation)

5. Couple items shown with Crown badge, sorted to top of gallery
   Admin can delete couple items from "Our Gallery" section
   (Sets status to 'rejected' via edge function)
```

---

## Data Flow

### Public Gallery Load

```
/moments page mounts
  └── supabase.from("uploads")
        .select("..., media(...)")
        .eq("status", "approved")
        .order("source", { ascending: true })  // couple first
        .order("created_at", { ascending: false })
        .range(0, 19)
        → UploadRow[] with nested media[]
        → rendered as masonry grid
```

### Guest Upload Data Flow

```
File selected
  └── Optional: imageCompression (browser-image-compression)
  └── supabase.from("uploads").insert({...}) → { id }
  └── Loop per file:
        supabase.storage.from("memories").upload(path, blob)
        supabase.storage.from("memories").getPublicUrl(path) → { publicUrl }
        supabase.from("media").insert({ upload_id, file_url, type })
  → status: "pending" — invisible to public until approved
```

### Admin Moderation Data Flow

```
AdminMoments → fetch(FN_URL, { headers: { "x-admin-password": pw } })
  └── Edge Function (Deno)
        validates password vs MOMENTS_ADMIN_PASSWORD secret
        uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
        action: "list" → supabase.from("uploads").select(...).eq("status", status)
        action: "moderate" → supabase.from("uploads").update({ status }).eq("id", id)
```

---

## Authentication Model

| User Type | How they access | Credential |
|---|---|---|
| Public visitor | Open URL | None |
| Guest uploader | Open URL | None (anonymous) |
| Admin (moderation) | `/admin/moments` password form | `MOMENTS_ADMIN_PASSWORD` secret (Supabase) |
| Admin (couple upload) | Same as above | Same |

There is **no Supabase Auth** in use. No sign-in, no JWT from Supabase, no user sessions. The Supabase client connects as `anon` role for all public operations. Only the edge function uses the service role.

---

## Known Limitations

1. **RSVP form does nothing** — submitting the form shows a thank-you message but the data is never saved to Supabase or anywhere else. This is a placeholder feature.

2. **Gift section is cosmetic** — "Send a Gift" button has no action. Bank account details are placeholders.

3. **Wedding date is null** — `Details.tsx` has `WEDDING_DATE: null`, so the countdown shows dashes. Date needs to be hardcoded to activate the countdown.

4. **Likes are localStorage only** — like counts are per-device and not persisted or synced. If the user clears storage, likes reset.

5. **Admin password in sessionStorage** — better than localStorage but still visible in browser devtools. Not a concern for a personal wedding app.

6. **No file size limit enforced on client** — the upload modal does not cap file size. Large videos will upload slowly. Supabase storage has a default 50 MB limit for anon uploads (configurable).

7. **No pagination on admin list** — the edge function returns up to 200 uploads. If there are more, older ones are not shown.

8. **Static Gallery on Index** — `Gallery.tsx` (on `/`) uses hardcoded local proposal images, not connected to the Supabase Moments system.
