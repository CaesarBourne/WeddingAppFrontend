# Phase 0 — Next.js Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the new consolidated Next.js (App Router) application — the target of `docs/ARCHITECTURE.md` §4.1 — with Tailwind + shadcn/ui, env/config validation, shared API types, and BFF auth/session wiring, so Phase 1 (public website) has a working foundation to build on.

**Architecture:** A new top-level `web/` directory (sibling to `src/`, `emmilove/`, `WeddingApp/`) holds the Next.js app. It talks to the existing NestJS backend over HTTP only — no backend code is touched (`WeddingApp/` is reference-only per `docs/ARCHITECTURE.md` §4.6). Server-side session state (JWT) lives in an httpOnly cookie, never in client-visible storage — an intentional upgrade over the old app's `localStorage` token.

**Tech Stack:** Next.js (App Router, TypeScript, Turbopack default), Tailwind CSS, shadcn/ui, Zod (env validation), Vitest (unit tests), npm.

## Global Constraints

- New app lives at `web/` (repo root), with source under `web/src/` (`--src-dir`), import alias `@/*` → `web/src/*`.
- Package manager: npm (matches root and `emmilove/` package-lock.json convention).
- No backend changes. `WeddingApp/` is not modified (see `docs/ARCHITECTURE.md` §4.6, `docs/BACKEND_IMPLEMENTATION_SPEC.md`).
- JWT/session token is never exposed to client-side JS — httpOnly cookie only, set/read via `next/headers`.
- `NEXT_PUBLIC_API_BASE_URL` is intentionally public (mirrors the old app's `VITE_API_BASE_URL`, which was already bundled client-side) — it is a URL, not a secret. The secret is the token, which stays server-side.
- Every command below is written as `cd web && <command>` because the working directory does not persist reliably between tool calls in this environment — always include the `cd`.
- Mirror proven logic from the existing app rather than inventing new patterns: `rawSrc`/`avatarSrc`/`errMessage` in `src/lib/api.ts` become `rawPhotoUrl`/`avatarUrl`/`parseApiError` in the new app; the axios request-interceptor pattern (`src/lib/api.ts:18-22`) becomes `buildAuthHeaders`.

---

### Task 1: Scaffold the Next.js app (create-next-app + shadcn/ui + Vitest)

**Files:**
- Create: `web/` (entire generated Next.js project — package.json, next.config.ts, tsconfig.json, tailwind config, src/app/layout.tsx, src/app/page.tsx, etc.)
- Create: `web/components.json`, `web/src/components/ui/button.tsx`, `web/src/components/ui/card.tsx`, `web/src/lib/utils.ts` (all shadcn-generated)
- Create: `web/vitest.config.ts`
- Create: `web/src/lib/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Next.js project at `web/` with `npm run dev`, `npm run build`, `npm run lint`, and `npm test` all working. Later tasks add files under `web/src/lib/`.

- [ ] **Step 1: Scaffold the project with create-next-app**

Run from the repo root:

```bash
npx -y create-next-app@latest web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --empty --yes
```

Expected: exits 0; creates `web/` with `package.json`, `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/tsconfig.json`, `tailwind` wired into `web/src/app/globals.css`.

- [ ] **Step 2: Verify the base app builds and runs**

```bash
cd web && npm run build
```

Expected: `Compiled successfully` (or equivalent success message), exit code 0.

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd web && npx shadcn@latest init -d -y
```

Expected: exits 0; creates `web/components.json` and `web/src/lib/utils.ts` (the `cn()` helper).

- [ ] **Step 4: Add the Button and Card components**

```bash
cd web && npx shadcn@latest add button card -y
```

Expected: exits 0; creates `web/src/components/ui/button.tsx` and `web/src/components/ui/card.tsx`.

- [ ] **Step 5: Add Vitest and a smoke test**

```bash
cd web && npm install -D vitest && npm pkg set scripts.test="vitest run"
```

Create `web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

Create `web/src/lib/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test to verify the harness works**

```bash
cd web && npm test
```

Expected: `1 passed`, exit code 0.

- [ ] **Step 7: Run lint to verify the scaffold is clean**

```bash
cd web && npm run lint
```

Expected: no errors (warnings acceptable), exit code 0.

- [ ] **Step 8: Commit**

```bash
cd web && cd .. && git add web && git commit -m "feat(web): scaffold Next.js app with Tailwind, shadcn/ui, and Vitest"
```

---

### Task 2: Env/config module

**Files:**
- Create: `web/src/lib/env.ts`
- Create: `web/src/lib/env.test.ts`
- Create: `web/.env.local.example`
- Create: `web/.env.local`

**Interfaces:**
- Consumes: nothing from prior tasks (pure module).
- Produces: `loadEnv(source?: NodeJS.ProcessEnv): Env` and `export const env: Env` — used by `lib/api-client.ts` (Task 4) and `lib/api-server.ts` (Task 6) for `NEXT_PUBLIC_API_BASE_URL`, and by the layout/page (Task 7) for branding strings.

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  it('applies defaults when optional vars are missing', () => {
    const result = loadEnv({});
    expect(result.NEXT_PUBLIC_API_BASE_URL).toBe('http://localhost:3000');
    expect(result.NEXT_PUBLIC_COUPLE_NAMES).toBe('Amara & Sefu');
    expect(result.NEXT_PUBLIC_WEDDING_DATE).toBe('Igbeyawo, 2025');
    expect(result.NEXT_PUBLIC_TAGLINE).toBe(
      'Every frame from the day, gathered in one place. Add yours.',
    );
  });

  it('uses provided values over defaults', () => {
    const result = loadEnv({
      NEXT_PUBLIC_API_BASE_URL: 'https://api.example.com',
      NEXT_PUBLIC_COUPLE_NAMES: 'Funmi & Emmanuel',
    });
    expect(result.NEXT_PUBLIC_API_BASE_URL).toBe('https://api.example.com');
    expect(result.NEXT_PUBLIC_COUPLE_NAMES).toBe('Funmi & Emmanuel');
  });

  it('throws when NEXT_PUBLIC_API_BASE_URL is not a valid URL', () => {
    expect(() => loadEnv({ NEXT_PUBLIC_API_BASE_URL: 'not-a-url' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/env.test.ts
```

Expected: FAIL — `Cannot find module './env'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/env.ts`:

```ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_COUPLE_NAMES: z.string().default('Amara & Sefu'),
  NEXT_PUBLIC_WEDDING_DATE: z.string().default('Igbeyawo, 2025'),
  NEXT_PUBLIC_TAGLINE: z
    .string()
    .default('Every frame from the day, gathered in one place. Add yours.'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  return parsed.data;
}

export const env = loadEnv();
```

- [ ] **Step 4: Install zod and run the test to verify it passes**

```bash
cd web && npm install zod && npx vitest run src/lib/env.test.ts
```

Expected: `3 passed`, exit code 0.

- [ ] **Step 5: Create the env file templates**

Create `web/.env.local.example`:

```
# Where the NestJS backend is reachable. Public — the browser hits /photos/:id/raw
# and other public endpoints directly. No trailing slash.
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Branding (optional) — reskins the site without code changes.
NEXT_PUBLIC_COUPLE_NAMES=Funmi & Emmanuel
NEXT_PUBLIC_WEDDING_DATE=Igbeyawo, 2025
NEXT_PUBLIC_TAGLINE=Every frame from the day, gathered in one place. Add yours.
```

Create `web/.env.local` with the same content (so `npm run dev`/`build` have working values locally; this file is already gitignored by the Next.js scaffold's default `.gitignore`).

- [ ] **Step 6: Run the full test suite and build to verify nothing broke**

```bash
cd web && npm test && npm run build
```

Expected: all tests pass; build succeeds.

- [ ] **Step 7: Commit**

```bash
cd web && cd .. && git add web/src/lib/env.ts web/src/lib/env.test.ts web/.env.local.example web/package.json web/package-lock.json && git commit -m "feat(web): add validated env/config module"
```

Note: `web/.env.local` is intentionally **not** committed (gitignored local config).

---

### Task 3: Shared API types (DTOs)

**Files:**
- Create: `web/src/lib/types.ts`

**Interfaces:**
- Consumes: nothing (pure type definitions).
- Produces: `PhotoDto`, `PaginationMeta`, `PagedPhotos`, `UploadResult`, `UserDto`, `GuestInfo`, `AuthUser` — used by `lib/api-client.ts` (Task 4) and all future phases' data fetching.

These mirror `src/types.ts` from the existing app, extended with the `source` field the backend spec (`docs/BACKEND_IMPLEMENTATION_SPEC.md` §2.4, §6.3) adds to `PhotoDto`, plus `status` for the moderation queue (added now since the type is shared — unused until Phase 3 wires the moderation UI).

- [ ] **Step 1: Write the types file**

Create `web/src/lib/types.ts`:

```ts
/** Photo record returned by GET /photos and GET /photos/moderation. */
export interface PhotoDto {
  id: string;
  filename: string | null;
  description: string | null;
  mimeType: string | null;
  width?: number;
  height?: number;
  baseUrl?: string;
  thumbnailUrl?: string;
  displayUrl?: string;
  downloadUrl?: string;
  rawUrl: string;
  creationTime: string | null;
  uploadedAt: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
  /** New field per docs/BACKEND_IMPLEMENTATION_SPEC.md §2.4 — 'guest' | 'couple'. */
  source: 'guest' | 'couple';
  /** Present only on GET /photos/moderation responses. */
  status?: 'pending' | 'approved' | 'rejected';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PagedPhotos {
  data: PhotoDto[];
  meta: PaginationMeta;
}

export interface UploadResult {
  createdCount: number;
  failedCount: number;
  created: PhotoDto[];
  failed: Array<{ filename?: string; reason?: string }>;
}

export type AdmissionStatus = 'pending' | 'admitted';

/** Guest info returned by POST /auth/guest-info. */
export interface GuestInfo {
  id: string;
  name?: string;
  role: string;
  admissionStatus: AdmissionStatus;
  admittedAt: string | null;
  avatarUrl: string | null;
}

/** Full user record returned by GET /users and GET /users/:id. */
export interface UserDto {
  id: string;
  name?: string;
  email: string | null;
  role: string;
  isActive: boolean;
  guestToken: string | null;
  buttonEnabled: boolean;
  admissionStatus: AdmissionStatus;
  admittedAt: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/** Authenticated user, decoded from GET /auth/me or a login response. */
export interface AuthUser {
  id: string;
  sub?: string;
  email: string | null;
  name?: string;
  role: 'guest' | 'admin' | 'super_admin';
  buttonEnabled: boolean;
  jti?: string;
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd web && cd .. && git add web/src/lib/types.ts && git commit -m "feat(web): add shared API DTO types"
```

---

### Task 4: API client pure helpers

**Files:**
- Create: `web/src/lib/api-client.ts`
- Create: `web/src/lib/api-client.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions; callers pass `baseUrl` explicitly so this module has no dependency on `env.ts`).
- Produces: `buildApiUrl(baseUrl, path, params?)`, `rawPhotoUrl(baseUrl, id, size?)`, `avatarUrl(baseUrl, userId)`, `class ApiError extends Error { status, details }`, `parseApiError(response, fallback?): Promise<ApiError>` — used by `lib/api-server.ts` (Task 6) and all future phases' fetch calls.

This directly ports the proven logic from `src/lib/api.ts`: `rawSrc()` → `rawPhotoUrl()`, `avatarSrc()` → `avatarUrl()`, `errMessage()` → `parseApiError()`.

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/api-client.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ApiError, avatarUrl, buildApiUrl, parseApiError, rawPhotoUrl } from './api-client';

describe('buildApiUrl', () => {
  it('joins a base URL and path', () => {
    expect(buildApiUrl('http://localhost:3000', '/photos')).toBe(
      'http://localhost:3000/photos',
    );
  });

  it('handles a base URL without a trailing slash and a path without a leading slash', () => {
    expect(buildApiUrl('http://localhost:3000', 'photos')).toBe(
      'http://localhost:3000/photos',
    );
  });

  it('appends query params, skipping undefined values', () => {
    const url = buildApiUrl('http://localhost:3000', '/photos', {
      page: 1,
      pageSize: 24,
      refresh: undefined,
    });
    expect(url).toBe('http://localhost:3000/photos?page=1&pageSize=24');
  });
});

describe('rawPhotoUrl', () => {
  it('builds a stable raw photo URL with the default display size', () => {
    expect(rawPhotoUrl('http://localhost:3000', 'abc 123')).toBe(
      'http://localhost:3000/photos/abc%20123/raw?size=display',
    );
  });

  it('accepts an explicit size', () => {
    expect(rawPhotoUrl('http://localhost:3000', 'abc', 'thumb')).toBe(
      'http://localhost:3000/photos/abc/raw?size=thumb',
    );
  });
});

describe('avatarUrl', () => {
  it('builds an avatar URL', () => {
    expect(avatarUrl('http://localhost:3000', 'user-1')).toBe(
      'http://localhost:3000/users/user-1/avatar',
    );
  });
});

describe('parseApiError', () => {
  it('extracts a string message', async () => {
    const response = new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
      status: 401,
    });
    const err = await parseApiError(response);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(err.message).toBe('Invalid credentials.');
  });

  it('joins an array message', async () => {
    const response = new Response(JSON.stringify({ message: ['a', 'b'] }), { status: 400 });
    const err = await parseApiError(response);
    expect(err.message).toBe('a, b');
  });

  it('falls back to the default message on a non-JSON body', async () => {
    const response = new Response('not json', { status: 500 });
    const err = await parseApiError(response, 'Something went wrong.');
    expect(err.message).toBe('Something went wrong.');
    expect(err.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd web && npx vitest run src/lib/api-client.test.ts
```

Expected: FAIL — `Cannot find module './api-client'`.

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/api-client.ts`:

```ts
export function buildApiUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\//, '');
  const url = new URL(normalizedPath, normalizedBase);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export type PhotoSize = 'thumb' | 'display' | 'download';

/** Stable, non-expiring image/video URL — mirrors src/lib/api.ts's rawSrc(). */
export function rawPhotoUrl(baseUrl: string, id: string, size: PhotoSize = 'display'): string {
  return buildApiUrl(baseUrl, `/photos/${encodeURIComponent(id)}/raw`, { size });
}

/** Public avatar URL — mirrors src/lib/api.ts's avatarSrc(). */
export function avatarUrl(baseUrl: string, userId: string): string {
  return buildApiUrl(baseUrl, `/users/${encodeURIComponent(userId)}/avatar`);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Turn a failed Response into a readable ApiError — mirrors src/lib/api.ts's errMessage(). */
export async function parseApiError(
  response: Response,
  fallback = 'Something went wrong.',
): Promise<ApiError> {
  let message = fallback;
  let details: unknown;
  try {
    const data = (await response.json()) as { message?: unknown };
    details = data;
    if (Array.isArray(data.message)) message = (data.message as string[]).join(', ');
    else if (typeof data.message === 'string') message = data.message;
  } catch {
    // response body wasn't JSON; keep the fallback message
  }
  return new ApiError(response.status, message, details);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/lib/api-client.test.ts
```

Expected: `9 passed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
cd web && cd .. && git add web/src/lib/api-client.ts web/src/lib/api-client.test.ts && git commit -m "feat(web): add API client URL and error-parsing helpers"
```

---

### Task 5: BFF session cookie wiring

**Files:**
- Create: `web/src/lib/session.ts`
- Create: `web/src/lib/session.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: `SESSION_COOKIE_NAME: string`, `sessionCookieOptions(nodeEnv: string)`, `getSessionToken(): Promise<string | null>`, `setSessionToken(token: string): Promise<void>`, `clearSessionToken(): Promise<void>` — consumed by `lib/api-server.ts` (Task 6) now, and by the real login/logout route handlers in Phase 2.

`getSessionToken`/`setSessionToken`/`clearSessionToken` depend on `next/headers`, which only works inside a request scope (Server Components, Route Handlers, Server Actions) — they are **not** unit-tested here; they're exercised for real once Phase 2 adds the login route handler. `sessionCookieOptions` is deliberately extracted as a pure function so its logic (production vs. dev cookie flags, expiry) is tested now.

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/session.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from './session';

describe('SESSION_COOKIE_NAME', () => {
  it('is a non-empty, stable name', () => {
    expect(SESSION_COOKIE_NAME).toBe('wpa_session');
  });
});

describe('sessionCookieOptions', () => {
  it('marks the cookie secure in production', () => {
    const opts = sessionCookieOptions('production');
    expect(opts.secure).toBe(true);
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.path).toBe('/');
  });

  it('does not require secure in development', () => {
    const opts = sessionCookieOptions('development');
    expect(opts.secure).toBe(false);
  });

  it('sets a 7-day max age, matching the backend default JWT_EXPIRES_IN', () => {
    const opts = sessionCookieOptions('development');
    expect(opts.maxAge).toBe(60 * 60 * 24 * 7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/session.test.ts
```

Expected: FAIL — `Cannot find module './session'`.

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/session.ts`:

```ts
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'wpa_session';

export function sessionCookieOptions(nodeEnv: string) {
  return {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches the backend's default JWT_EXPIRES_IN
  };
}

/** Reads the session JWT. Must be called within a request scope (Server Component, Route Handler, Server Action). */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Sets the session JWT as an httpOnly cookie. Callable only from a Route Handler or Server Action. */
export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(process.env.NODE_ENV ?? 'development'));
}

/** Clears the session cookie (logout). Callable only from a Route Handler or Server Action. */
export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/lib/session.test.ts
```

Expected: `4 passed`, exit code 0.

- [ ] **Step 5: Run the full suite and build (this module touches `next/headers`, so a build-level check matters more than usual)**

```bash
cd web && npm test && npm run build
```

Expected: all tests pass; build succeeds (confirms `next/headers` usage is valid at the module boundary even though `getSessionToken`/`setSessionToken`/`clearSessionToken` aren't called yet).

- [ ] **Step 6: Commit**

```bash
cd web && cd .. && git add web/src/lib/session.ts web/src/lib/session.test.ts && git commit -m "feat(web): add BFF session cookie wiring"
```

---

### Task 6: Server-side authenticated fetch wrapper

**Files:**
- Create: `web/src/lib/api-server.ts`
- Create: `web/src/lib/api-server.test.ts`

**Interfaces:**
- Consumes: `buildApiUrl` from `lib/api-client.ts` (Task 4), `getSessionToken` from `lib/session.ts` (Task 5), `env` from `lib/env.ts` (Task 2).
- Produces: `buildAuthHeaders(token: string | null, existing?: HeadersInit): Headers`, `apiFetch(path: string, options?: ApiFetchOptions): Promise<Response>` — consumed by all future phases' server-side data fetching (Server Components, Route Handlers).

`buildAuthHeaders` is the pure, testable unit — it mirrors the axios request interceptor at `src/lib/api.ts:18-22`. `apiFetch` itself depends on `getSessionToken` (request-scoped `next/headers`), so it is exercised via the build check here and via real usage starting Phase 2.

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/api-server.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildAuthHeaders } from './api-server';

describe('buildAuthHeaders', () => {
  it('sets the Authorization header when a token is present', () => {
    const headers = buildAuthHeaders('abc123');
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('omits the Authorization header when the token is null', () => {
    const headers = buildAuthHeaders(null);
    expect(headers.has('Authorization')).toBe(false);
  });

  it('preserves existing headers', () => {
    const headers = buildAuthHeaders('abc123', { 'Content-Type': 'application/json' });
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/api-server.test.ts
```

Expected: FAIL — `Cannot find module './api-server'`.

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/api-server.ts`:

```ts
import { buildApiUrl } from './api-client';
import { env } from './env';
import { getSessionToken } from './session';

export interface ApiFetchOptions extends Omit<RequestInit, 'headers'> {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: HeadersInit;
}

/** Attaches a Bearer token to a Headers instance — mirrors src/lib/api.ts's axios request interceptor. */
export function buildAuthHeaders(token: string | null, existing?: HeadersInit): Headers {
  const headers = new Headers(existing);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

/** Server-only fetch wrapper: attaches the session JWT and resolves against the API base URL. */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { params, headers, ...init } = options;
  const token = await getSessionToken();
  const url = buildApiUrl(env.NEXT_PUBLIC_API_BASE_URL, path, params);
  return fetch(url, {
    ...init,
    headers: buildAuthHeaders(token, headers),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/lib/api-server.test.ts
```

Expected: `3 passed`, exit code 0.

- [ ] **Step 5: Run the full suite, lint, and build**

```bash
cd web && npm test && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
cd web && cd .. && git add web/src/lib/api-server.ts web/src/lib/api-server.test.ts && git commit -m "feat(web): add server-side authenticated fetch wrapper"
```

---

### Task 7: Root layout, placeholder home page, and Phase 0 verification

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Consumes: `env` from `lib/env.ts` (Task 2), `Button`/`Card` from `components/ui/*` (Task 1).
- Produces: a visible page proving Next.js + Tailwind + shadcn/ui + env config work together end-to-end. Phase 1 will replace `page.tsx`'s content with the real wedding site.

- [ ] **Step 1: Write the root layout**

Replace the contents of `web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { env } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_COUPLE_NAMES,
  description: env.NEXT_PUBLIC_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Write the placeholder home page**

Replace the contents of `web/src/app/page.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { env } from '@/lib/env';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{env.NEXT_PUBLIC_COUPLE_NAMES}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">{env.NEXT_PUBLIC_TAGLINE}</p>
          <p className="text-sm text-muted-foreground">{env.NEXT_PUBLIC_WEDDING_DATE}</p>
          <Button>Scaffold ready — Phase 1 builds the real site here</Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Start the dev server and verify visually**

```bash
cd web && npm run dev
```

Open `http://localhost:3000` in a browser (note: the backend also defaults to port 3000 — if it's running, either stop it first or the Next.js dev server will pick the next free port, e.g. 3001; check the terminal output for the actual URL). Confirm: the couple names render as the card title, the tagline and date render, and the button is styled (rounded, shadcn theme) — not unstyled HTML. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 4: Run full Phase 0 verification**

```bash
cd web && npm test && npm run lint && npm run build
```

Expected: all tests pass (20 total across Tasks 1–6), lint is clean, build succeeds.

- [ ] **Step 5: Commit**

```bash
cd web && cd .. && git add web/src/app/layout.tsx web/src/app/page.tsx && git commit -m "feat(web): wire root layout and placeholder home page to env config"
```

---

## Phase 0 exit criteria

- [ ] `cd web && npm run dev` serves a page at localhost showing couple names, tagline, date, and a styled shadcn Button.
- [ ] `cd web && npm run build` succeeds.
- [ ] `cd web && npm run lint` is clean.
- [ ] `cd web && npm test` passes (smoke 1 + env 3 + api-client 9 + session 4 + api-server 3 = 20 tests).
- [ ] No files under `WeddingApp/`, `src/`, or `emmilove/` were modified.
- [ ] Next up: Phase 1 (public website) per `docs/ARCHITECTURE.md` — no backend dependency, can proceed immediately on the same model (Sonnet).
