# Backend Implementation Spec — Consolidation onto NestJS

> Audience: **frontend and backend engineers**. Companion to [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> and [`MODERATION.md`](./MODERATION.md).
> Every claim below was verified against the compiled backend in `WeddingApp/dist/` (module wiring,
> guards, controllers, services, entities). Paths are given as their `src` equivalents
> (e.g. `photos/photos.service.ts`).
> Generated: 2026-07-10. Status: **IMPLEMENTED (2026-07-11) — see the banner below.**

> ## ⚠️ Implementation update (2026-07-11): built with **Approach A**, not album-membership
>
> The moderation backend has been **implemented and validated end-to-end** against the real Google
> Photos account, but with a **different, simpler design** than the album-membership approach this
> document originally specified. A spike proved album operations are too slow (eventual consistency)
> and partially blocked (append-only token scope can't remove from albums).
>
> **What was actually built (the authoritative contract is [`MODERATION.md`](./MODERATION.md) §5):**
> - Moderation is a **database `status`** (not album membership). All uploads go into the album at
>   upload time; the DB decides visibility.
> - Public `GET /photos` is a **pure DB read** of approved rows (media metadata is stored in
>   `PhotoMeta`); `GET /photos/:id/raw` **denies non-approved**; `PATCH /photos/:id/status` is a
>   DB-only, instant approve/reject.
> - **`GooglePhotosService` is UNCHANGED** — the `batchAddMediaItems`/`batchRemoveMediaItems` additions
>   this doc proposed (§3.2) were **not used**. No Google token re-mint needed (append-only scope suffices).
>
> **5 backend files changed** (copy these to the real backend repo):
> `photos/entities/photo-meta.entity.ts`, `photos/photo-meta.service.ts`, `photos/photos.service.ts`,
> `photos/dto/list-photos.dto.ts`, `photos/photos.controller.ts`.
>
> Sections below are retained as the original analysis/rationale; where they describe album-membership
> mechanics, defer to `MODERATION.md`.

> **Repository boundary:** the NestJS backend is a **separate repository**. The `WeddingApp/` copy in
> this workspace is **reference only** — a working mirror. Edited files are copied by hand into the
> backend repo, then built & deployed there. Backend business logic is never migrated into the Next.js
> app. (See `ARCHITECTURE.md` §4.6.)

## How to read this document

The guiding rule from the project owner: **do not assume a backend change is needed just because the
architecture changed.** The finding of this audit is that the backend is **~85% reusable as-is**. The
moderation feature is a small, additive extension of an existing metadata layer — not a rebuild.

Global facts that shape everything (verified in `app.module.ts`, `main.ts`, `jwt.strategy.ts`):

- **Global `JwtAuthGuard`** (`APP_GUARD`) — every route needs a JWT **unless** marked `@Public()`.
- **Global `ThrottlerGuard`** — 120 req / 60 s per IP.
- **`@Public()` routes today:** `POST /auth/login`, `POST /auth/guest`, `GET /users/:id/avatar`,
  `GET /photos/:id/raw`. Everything else is authenticated.
- **`RolesGuard`** applies only where `@Roles(...)` is present; otherwise any valid JWT passes.
- **Guest sessions are one-device**: the JWT `jti` must equal `user.currentJti`.
- **`ValidationPipe`** is global with `whitelist + forbidNonWhitelisted + transform`.
- **TypeORM `synchronize: true`** for both SQLite and Postgres → additive nullable columns auto-apply.

---

## 1. Existing functionality that works UNCHANGED

Everything in this section already satisfies the new architecture and is reused **as-is**.

### 1.1 Authentication & identity — reused wholesale

| Item | File | Why it stays unchanged |
|---|---|---|
| Admin login `POST /auth/login` | `auth/auth.controller.ts` | The public site's admin login uses it directly. JWT issuance is exactly what we want. |
| Guest QR login `POST /auth/guest` | `auth.controller.ts` / `auth.service.ts` | The invitation flow. Exchanges the QR token for a JWT with one-device `jti`. No change. |
| `GET /auth/me` | `auth.controller.ts` | Session restore on app load. Returns the decoded user. Unchanged. |
| `POST /auth/guest-info` (admin) | `auth.controller.ts` | Powers the QR-scan → admission redirect. Unchanged. |
| `POST /auth/admins`, `GET /auth/admins` | `auth.controller.ts` | Super-admin account management already exists (frontend may finally surface it, but the API is done). |
| JWT strategy + one-device enforcement | `auth/strategies/jwt.strategy.ts` | Guest single-device security is a feature we keep verbatim. |
| `RolesGuard`, `JwtAuthGuard`, `@Public`, `@Roles`, `@CurrentUser` | `auth/guards/`, `common/decorators/` | The authorization primitives the whole new admin surface relies on. Unchanged. |

### 1.2 Guest & user management — reused wholesale

The entire `users` surface already covers guest management, avatars, and admission. **No changes.**

| Endpoint | Role | Powers (frontend) |
|---|---|---|
| `POST /users/guests` | ADMIN+ | Create guest + QR token |
| `GET /users`, `GET /users/:id` | ADMIN+ | Guest/admin list; admission status fetch |
| `PATCH /users/guests/:id/button` | ADMIN+ | Welcome-page second button toggle |
| `DELETE /users/guests/:id`, `DELETE /users/admins/:id` | ADMIN+ / SUPER_ADMIN | Delete guest / admin |
| `POST /users/me/avatar` | any auth | Guest self-avatar |
| `PATCH /users/:id/avatar` | ADMIN+ | Admin sets avatar |
| `GET /users/:id/avatar` | `@Public` | Avatar `<img>` display |
| `POST /users/:id/admit` | ADMIN+ | Entrance admission (idempotent) |

`User` entity, `UsersService`, seeding of the super-admin (`onModuleInit`), bcrypt hashing, and the
`guestToken` generation are all unchanged.

### 1.3 Google Photos integration — reused, with two additive methods (see §3)

| Item | File | Why it stays |
|---|---|---|
| OAuth/token plumbing | `google-photos/google-auth.service.ts` | Works; untouched. |
| `uploadBytes`, album resolution/creation, `mediaItems:search` index, `mediaItems:batchGet` | `google-photos/google-photos.service.ts` | The upload + read primitives are exactly what moderation reuses. |
| Two-layer cache (album index + fresh URLs) | `photos/photo-cache.service.ts` | URL-expiry abstraction. Unchanged; we only call `bustIndex()` on approve. |
| `GET /photos/:id/raw` redirect | `photos/photos.controller.ts` | The stable public media URL. Works for library-only (pending) items too. Unchanged (optional hardening in §3). |
| `POST /photos/refresh` | `photos/photos.controller.ts` | Admin album re-sync. Unchanged. |
| Google OAuth setup routes `/google/*` | `google-photos/google-photos.controller.ts` | Setup-only. Unchanged. |

### 1.4 Cross-cutting — unchanged

Global `ValidationPipe`, `AllExceptionsFilter` (consistent error envelope), throttling, CORS config,
Swagger generation, config/validation schema. All reused.

---

## 2. Existing functionality that requires MODIFICATION

Five items. All additive/backward-compatible **except** the intended guest-upload behavior change.

### 2.1 `GET /photos` — make public + expose `source` + honor anonymity

- **File:** `photos/photos.controller.ts` (`list`), `photos/photos.service.ts` (`list`, `toDto`).
- **Current behavior:** requires a JWT (global guard, no `@Public`). Returns the whole album (album
  index) to any authenticated user. `PhotoDto` has no `source`/`status`.
- **Required behavior:** mark `@Public()` so the SSR public site and BFF can read it without a token.
  Add `source` to `PhotoDto` (couple crown badge + couple-first sort). When a photo's `PhotoMeta.isAnonymous`
  is true, return `uploaderName: null`.
- **Reason:** the approved gallery is public; the frontend needs `source` for couple styling; anonymity
  must be enforced server-side, not in the client.
- **Breaking?** **Backward compatible.** Existing authenticated callers keep working; `@Public` only
  *removes* a requirement. Added DTO fields are additive. Because "album = approved," the set returned is
  unchanged until moderation lands.
- **Frontend depends on it:** public `/moments` gallery, couple crown badge + sort.

### 2.2 `POST /photos/upload` & `/photos/upload/bulk` — branch on role (pending vs approved)

- **File:** `photos/photos.service.ts` (`uploadSingle`, `uploadBulk`), `photos/photos.controller.ts`.
- **Current behavior:** any authenticated user's upload goes **straight into the album** via
  `google.batchCreate(albumId, …)` and is immediately public. Uploader saved to `PhotoMeta`.
- **Required behavior:** branch on `req.user.role`:
  - **GUEST** → `batchCreate(null, …)` (library-only) + `PhotoMeta {status:'pending', source:'guest'}`.
    Not added to the album → not public until approved.
  - **ADMIN / SUPER_ADMIN** → `batchCreate(albumId, …)` (today's path) + `PhotoMeta {status:'approved',
    source:'couple'}`.
  - Pass `req.user.role` into the service; accept optional `isAnonymous` on `UploadPhotoDto`.
- **Reason:** the core requirement — guest uploads require approval before becoming visible; couple
  uploads auto-publish with a crown.
- **Breaking?** **Behavior change for guests** (intended): previously instant, now pending. Admin path
  unchanged. API shape unchanged (still multipart `file`/`files` + `description`, plus optional
  `isAnonymous`). No response-shape break.
- **Frontend depends on it:** authenticated upload flow; the entire moderation guarantee.

### 2.3 `PhotoMetaService.saveMany` — record `status` / `source`

- **File:** `photos/photo-meta.service.ts`.
- **Current:** `saveMany(googlePhotoIds, uploader)` inserts `{googlePhotoId, uploaderId, uploaderName}`
  with `.orIgnore()`.
- **Required:** accept `{ status, source, isAnonymous }` and persist them.
- **Reason:** moderation state must be written at upload time.
- **Breaking?** Backward compatible (new params default to `pending`/`guest`/`false`).
- **Frontend depends on it:** moderation queue, couple badge.

### 2.4 `PhotoDto` (`toDto`) — add `source` (+ optional `status`, `isAnonymous`)

- **File:** `photos/photos.service.ts` (`toDto`).
- **Current:** returns id, urls, uploader fields, `uploadedAt`.
- **Required:** include `source`; include `status` for the moderation queue DTO; null out `uploaderName`
  when anonymous on the public list.
- **Reason:** frontend rendering (crown, sort, anonymity, moderation tabs).
- **Breaking?** Additive → backward compatible.
- **Frontend depends on it:** `/moments` gallery + moderation dashboard.

### 2.5 `GooglePhotosService.batchCreate` — make `albumId` optional

- **File:** `google-photos/google-photos.service.ts`.
- **Current:** always includes `albumId` in the `mediaItems:batchCreate` body.
- **Required:** when `albumId` is null/undefined, omit it → item is created in the **library only**.
- **Reason:** enables the pending (not-in-album) state without a second store.
- **Breaking?** Backward compatible (existing callers pass an `albumId`).
- **Frontend depends on it:** indirectly — the pending upload path.

---

## 3. Entirely NEW backend functionality

Kept to the minimum. Everything reuses existing services; no new module, no new storage.

### 3.1 New `PhotoMeta` columns

| Column | Type | Default | Why it can't be reused | Enables |
|---|---|---|---|---|
| `status` | varchar | `'pending'` | No moderation concept exists anywhere in the backend today. | The entire approval workflow. |
| `source` | varchar | `'guest'` | No couple/guest distinction exists. | Crown badge, couple-first sort, auto-approve. |
| `isAnonymous` | boolean | `false` | No anonymity concept. Reuses `uploaderId` internally for accountability. | "Hide my name" display toggle. |

These land on the **existing** `photo_meta` table — not a new entity — mirroring the `User.admissionStatus`
varchar-default convention already in the codebase.

### 3.2 New Google album operations

| Method | Endpoint | Why new | Enables |
|---|---|---|---|
| `batchAddMediaItems(albumId, ids)` | `POST /v1/albums/{albumId}:batchAddMediaItems` | The app never needed to add a pre-existing item to the album — uploads went straight in. | **Approve** (publish). |
| `batchRemoveMediaItems(albumId, ids)` | `POST /v1/albums/{albumId}:batchRemoveMediaItems` | No un-publish path exists today. | **Un-approve** (move approved → rejected without deleting bytes). |

Both operate on the **app-created** album and **app-uploaded** items — the exact conditions Google
requires. **Validate with the spike in §8 before building.**

### 3.3 New `PhotoMetaService` methods

- `findByStatus(status)` — pending/approved/rejected lists for the queue. (Add index — see §7.)
- `updateStatus(googlePhotoId, status)` — flip on moderate.

Why new: the current service only has `saveMany` + `findByGoogleIds`. Minimal additions, same repository.

### 3.4 New `PhotosService` methods

- `listModeration(status)` — `findByStatus` → resolve preview URLs via the **existing**
  `PhotoCacheService.getFreshByIds` (ID-based, works for library-only items).
- `setStatus(googlePhotoId, status)` — approve → `batchAddMediaItems` + `bustIndex` + `updateStatus`;
  reject-from-approved → `batchRemoveMediaItems` + `bustIndex` + `updateStatus`; reject-from-pending →
  `updateStatus` only.

### 3.5 New endpoints (2)

| Method | Route | Auth | Why new / why not reuse |
|---|---|---|---|
| `GET` | `/photos/moderation?status=` | ADMIN+ | `GET /photos` reads the **album** (approved only); pending items aren't there. A status-driven read from `PhotoMeta` is genuinely different. |
| `PATCH` | `/photos/:id/status` | ADMIN+ | No state-transition endpoint exists. Replaces the Supabase edge function's `moderate` action, now under JWT roles instead of a shared password. |

**No other new endpoints.** Couple upload reuses `POST /photos/upload` (role decides). Moderation admin
reuses the existing JWT/roles (no shared-password endpoint). The Supabase edge function and tables are
**deleted, not replaced**.

---

## 4. Frontend work that can begin IMMEDIATELY

The frontend is largely **unblocked** because auth, guests, admission, and avatars already exist.

**Phase F0 — Scaffold (no backend dependency).** Next.js App Router + Tailwind + shadcn, env/config,
shared API client, BFF auth wiring (token attach + `/raw` proxy).

**Phase F1 — Public website (no backend dependency).** Port all emmilove static sections (Hero, Story,
Proposal, Details, Video, Gift, Footer) and RSVP as a static form. Ships value immediately; SSR/SEO.

**Phase F2 — Auth + invitation + admin ops (uses EXISTING endpoints).** Build against today's backend
unchanged:
- Guest QR login (`POST /auth/guest`), session restore (`GET /auth/me`), admin login (`POST /auth/login`).
- Guest welcome + avatar (`POST /users/me/avatar`).
- Admin dashboard: guest CRUD, QR generation, button toggle, admission scan
  (`/users/*`, `/auth/guest-info`) — **all already implemented**.

**Phase F3 — Moments gallery + upload UI (partially blocked).** Build the gallery grid, lightbox, and
upload modal (with `browser-image-compression`) now. It can run against the authenticated `GET /photos`
today. The *public* (tokenless) read, the crown badge/sort (`source`), and the *pending* upload result
depend on §2.1/§2.2/§2.4.

**Phase F4 — Moderation dashboard (blocked).** Depends on §3.5 (`GET /photos/moderation`,
`PATCH /photos/:id/status`).

**Blocking dependencies (only these):** public gallery read → §2.1; crown/sort → §2.4; pending-upload
result → §2.2; moderation UI → §3.5.

---

## 5. Backend-first priorities (prioritized checklist)

### Critical — the moderation core; nothing works without it
- [ ] **Spike:** validate `batchCreate(no album)` + `batchAddMediaItems` + `batchRemoveMediaItems` (§8).
  *Everything below depends on this being true; if false, switch to Approach C.*
- [ ] `PhotoMeta.status` + `source` columns (§3.1) — the state that the whole feature reads/writes.
- [ ] Upload role-branch: guest → library-only + `pending` (§2.2) — the actual "hold for approval."
- [ ] `batchAddMediaItems` + `setStatus` approve path (§3.2/§3.4) — makes approval publish.
- [ ] `GET /photos/moderation` + `PATCH /photos/:id/status` (§3.5) — the admin's only way to act.

### Required — needed for correct/complete UX, but not the core mechanism
- [ ] `GET /photos` → `@Public` (§2.1) — public site can't read the gallery otherwise.
- [ ] `source` (+ `status`) in DTO (§2.4) — couple badge/sort, moderation tabs.
- [ ] `isAnonymous` capture + server-side name hiding (§3.1/§2.1) — anonymity must be enforced server-side.
- [ ] `batchRemoveMediaItems` + un-approve path (§3.2) — lets admins reverse an approval.

### Nice to have — hardening/quality, not blocking
- [ ] Gate `GET /photos/:id/raw` for non-approved items unless admin (§ optional) — IDs are opaque, so low risk today.
- [ ] Index on `photo_meta(status)` (§7) — perf once volume grows.
- [ ] Explicit migration files instead of relying on `synchronize` (§7) — production safety.

### Future enhancement — out of scope for launch
- [ ] Named albums grouping; `POST /rsvp` persistence; server-side likes; realtime gallery updates.
  *Deferred per YAGNI; none are needed for the consolidation or moderation.*

---

## 6. API Contract

Legend: **E** = existing/unchanged · **M** = modified · **N** = new. Auth is JWT unless `@Public`.

### 6.1 Auth (`/auth`) — all EXISTING, unchanged

| # | Method | Route | Auth | Notes |
|---|---|---|---|---|
| E | POST | `/auth/login` | Public | `{email, password}` → `{accessToken, user}`; 401 on bad creds |
| E | POST | `/auth/guest` | Public | `{token}` → `{accessToken, user}`; issues one-device `jti`; 401 invalid |
| E | GET | `/auth/me` | any | → decoded user `{sub,email,role,name,buttonEnabled,jti}` |
| E | POST | `/auth/guest-info` | ADMIN+ | `{token}` → guest profile (no session); 404 invalid |
| E | POST | `/auth/admins` | SUPER_ADMIN | `CreateAdminDto`; 409 email exists |
| E | GET | `/auth/admins` | SUPER_ADMIN | admin list |

### 6.2 Users (`/users`) — all EXISTING, unchanged

`POST /users/guests` (ADMIN+, `{name}`), `GET /users`, `GET /users/:id`,
`PATCH /users/guests/:id/button` (`{enabled}`), `DELETE /users/guests/:id`,
`DELETE /users/admins/:id` (SUPER_ADMIN), `POST /users/me/avatar` (any auth, multipart `file`),
`PATCH /users/:id/avatar` (ADMIN+), `GET /users/:id/avatar` (Public), `POST /users/:id/admit` (ADMIN+).
Validation and error envelopes unchanged.

### 6.3 Photos (`/photos`) — the only section with changes

| # | Method | Route | Auth | Request | Response | Notes |
|---|---|---|---|---|---|---|
| **M** | GET | `/photos` | **Public** (was any-JWT) | query `page≥1`, `pageSize 1–100`, `refresh?` | `{ data: PhotoDto[], meta }` | Approved gallery (album). **Adds `source`**; nulls `uploaderName` when anonymous. *Extends existing.* |
| E | GET | `/photos/:id` | any | — | `PhotoDto` | Unused by FE; unchanged. |
| E | GET | `/photos/:id/raw` | Public | query `size` | 302 redirect | Unchanged (optional hardening later). |
| **M** | POST | `/photos/upload` | any auth | multipart `file`, `description?`, **`isAnonymous?`** | `PhotoDto` | Guest→pending(library); admin→approved(album). *Extends existing.* |
| **M** | POST | `/photos/upload/bulk` | any auth | multipart `files[]`, `description?`, **`isAnonymous?`** | `{createdCount,failedCount,created[],failed[]}` | Same branching. *Extends existing.* |
| E | POST | `/photos/refresh` | ADMIN+ | — | `{total}` | Unchanged. |
| **N** | GET | `/photos/moderation` | ADMIN+ | query `status=pending\|approved\|rejected` | `{ data: PhotoDto[] }` (incl. `status`,`source`) | New. Reads `PhotoMeta` by status. |
| **N** | PATCH | `/photos/:id/status` | ADMIN+ | `{ status: 'approved'\|'rejected' }` | `{ id, status }` | New. approve→add-to-album; reject→remove/skip. Replaces Supabase `moderate`. |

**Validation:** reuse the global `ValidationPipe`. `status` must be one of the enum (400 otherwise).
`isAnonymous` optional boolean. **Errors:** existing envelope `{statusCode,message,error}`; `401`
unauthenticated, `403` wrong role, `400` bad status, `404` unknown id, `502` Google error.

**`PhotoDto` additions:** `source: 'guest'|'couple'`; `status` (moderation responses only);
`uploaderName` becomes `null` when anonymous on public responses.

---

## 7. Database changes

- **Reused unchanged:** `users` table (whole entity), `photo_meta` base columns
  (`id`, `googlePhotoId` unique, `uploaderId`, `uploaderName`, `uploadedAt`).
- **Modified table:** `photo_meta` — **new columns** `status varchar default 'pending'`,
  `source varchar default 'guest'`, `isAnonymous boolean default false`.
- **New indexes:** `idx_photo_meta_status` on `photo_meta(status)` for the moderation queue.
- **New relationships:** none. `uploaderId` remains a soft reference to `users.id` (as today — no FK).
- **Migrations:** the app runs `synchronize: true`, so the three nullable/defaulted columns **auto-add**
  on boot in both SQLite and Postgres. **Recommendation:** for production, disable `synchronize` and add
  an explicit migration (create the columns + index) so schema changes are reviewable and reversible.
- **Data backfill:** existing `photo_meta` rows (already in the album) should be set `status='approved'`
  — a one-line `UPDATE ... WHERE status IS NULL`. Existing photos are, by definition, already public.

**No Supabase schema is migrated in** — the `uploads`/`media` tables and `memories` bucket are retired.
If the Supabase project holds real uploads, run a one-off export→`POST /photos/upload` (as admin) at
cutover; likely negligible pre-launch.

---

## 8. Migration impact

### 8.1 Spike (do first — de-risks the whole plan)
- **Risk:** Medium — the one external unknown. **Complexity:** Low. **Effort:** ~0.5 day.
- **Test:** create item without album → confirm absent from `GET /photos`; `/raw` resolves it;
  `batchAddMediaItems` → appears; `batchRemoveMediaItems` → disappears.
- **Rollback:** n/a (read-only investigation). If it fails → adopt Approach C (staged store); frontend,
  DTOs, and endpoints are unaffected.

### 8.2 `PhotoMeta` columns + backfill
- **Risk:** Low. **Complexity:** Low. **Effort:** ~0.5 day.
- **Test:** boot with `synchronize`; verify columns; backfill sets existing rows approved; existing
  gallery still renders.
- **Rollback:** columns are additive and nullable — drop them; no data loss to existing behavior.

### 8.3 Upload role-branch (guest → pending)
- **Risk:** Medium (changes a user-visible behavior). **Complexity:** Medium. **Effort:** ~1 day.
- **Test:** guest upload → absent from public list, present in `?status=pending`; admin upload → visible
  immediately with `source=couple`.
- **Rollback:** feature-flag the branch (env or config) to fall back to direct-to-album if needed.

### 8.4 Approve/reject (`setStatus`, album add/remove, endpoints)
- **Risk:** Medium (depends on §8.1). **Complexity:** Medium. **Effort:** ~1–1.5 days.
- **Test:** E2E approve → appears publicly; reject-pending → never appears; un-approve → disappears;
  role guard blocks non-admins (403); bad status → 400.
- **Rollback:** endpoints are additive; disabling them leaves uploads in `pending` (safe default:
  nothing wrongly public).

### 8.5 `GET /photos` → public + DTO `source`
- **Risk:** Low. **Complexity:** Low. **Effort:** ~0.5 day.
- **Test:** tokenless request returns approved items; anonymous rows hide `uploaderName`; authed callers
  unaffected.
- **Rollback:** re-add the guard; remove added fields (additive, safe).

**Total core backend effort:** ~3.5–4 developer-days after the spike, mostly Medium-risk, all reversible.

---

## 9. Dependency matrix

### 9.1 Frontend → backend

| Frontend task | Needs backend | Can start now? |
|---|---|---|
| F0 Scaffold | — | ✅ Yes |
| F1 Public website (static) | — | ✅ Yes |
| F2 Auth / invitation / admin ops | Existing endpoints only | ✅ Yes |
| F3 Gallery + upload UI | Runs vs authed `GET /photos` now; full parity needs §2.1, §2.2, §2.4 | 🟡 Start now, finish after |
| F3 Public (tokenless) gallery read | §2.1 (`GET /photos` public) | 🔴 Blocked |
| F3 Couple crown badge + sort | §2.4 (`source` in DTO) | 🔴 Blocked |
| F3 Pending-upload confirmation UX | §2.2 (guest→pending) | 🔴 Blocked |
| F4 Moderation dashboard | §3.5 endpoints (+ §3.1/§3.4) | 🔴 Blocked |

### 9.2 Backend → backend (ordering)

```
Spike (§8.1)
  └─► PhotoMeta columns + backfill (§3.1/§7)
        ├─► Upload role-branch (§2.2)  ──────────────┐
        └─► batchAdd/Remove + setStatus (§3.2/§3.4) ─┴─► Moderation endpoints (§3.5)
GET /photos public + DTO source (§2.1/§2.4)  ── independent of the spike ──► (ready anytime)
```

- **Spike** gates everything that touches album membership.
- **PhotoMeta columns** gate upload-branch and setStatus.
- **Moderation endpoints** depend on setStatus.
- **`GET /photos` public + `source` DTO** is **independent** and can ship in parallel from day one.

### 9.3 Fully parallelizable (no shared dependency)

- Frontend F0/F1/F2 ‖ the entire backend track.
- Backend "`GET /photos` public + DTO `source`" ‖ the spike/moderation track.
- Frontend F3 gallery/upload UI build ‖ backend moderation work (integrate when endpoints land).

---

## 10. Summary

- **Reuse:** all of auth, users, guests, admission, avatars, Google upload/read/cache, `/raw`, refresh.
- **Modify (additive/backward-compatible):** `GET /photos` (public + `source`), upload role-branch,
  `saveMany`, `toDto`, `batchCreate` optional album.
- **New (minimal):** 3 `PhotoMeta` columns, 2 Google album ops, 2 service methods, 2 endpoints.
- **Retire:** Supabase DB, storage, edge function, shared-password admin.
- **No unnecessary APIs:** couple upload reuses `POST /photos/upload`; moderation reuses JWT roles.

Nothing here is implemented yet. Awaiting your review before code begins; the first step will be the §8.1 spike.
