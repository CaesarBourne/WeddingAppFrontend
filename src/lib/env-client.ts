/**
 * Client-safe env access. `lib/env.ts`'s `loadEnv(source = process.env)` reads
 * `process.env` through a variable, which Next.js does NOT statically inline into
 * client bundles (only literal `process.env.NEXT_PUBLIC_X` dot-access is replaced
 * at build time). So `env` from `lib/env.ts` is server-only. Client Components that
 * need a public env value (e.g. to build an image URL) must import from here instead.
 */
export const clientEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
} as const;
