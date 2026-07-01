import { z } from 'zod'

/**
 * Server-only environment. Read lazily (inside handlers / at first DB use),
 * never at module top-level, so Vercel can inject vars per request.
 * None of these are `VITE_`-prefixed, so they never reach the client bundle.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  GOOGLE_SHEET_ID: z.string().min(1, 'GOOGLE_SHEET_ID is required'),
  GOOGLE_SHEET_GID: z.string().min(1, 'GOOGLE_SHEET_GID is required'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (cached) return cached

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    GOOGLE_SHEET_GID: process.env.GOOGLE_SHEET_GID,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => issue.message)
      .join(', ')
    throw new Error(`Invalid server environment: ${issues}`)
  }

  cached = parsed.data
  return cached
}
