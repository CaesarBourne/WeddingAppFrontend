import { z } from "zod";

// Server-only: loadEnv reads `process.env` through a variable, which Next.js does
// NOT inline into client bundles. Do not import `env` from this file into a
// "use client" component — use `clientEnv` from `lib/env-client.ts` instead.

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_COUPLE_NAMES: z.string().default("Amara & Sefu"),
  NEXT_PUBLIC_WEDDING_DATE: z.string().default("Igbeyawo, 2025"),
  NEXT_PUBLIC_TAGLINE: z
    .string()
    .default("Every frame from the day, gathered in one place. Add yours."),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}

export const env = loadEnv();
