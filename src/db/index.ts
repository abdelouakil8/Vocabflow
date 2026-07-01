import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { getServerEnv } from '../lib/env'
import * as schema from './schema'

function createDb() {
  const { DATABASE_URL } = getServerEnv()
  const sql = neon(DATABASE_URL)
  return drizzle({ client: sql, schema })
}

type Db = ReturnType<typeof createDb>

/** Drizzle client type, for typing functions that receive `db`. */
export type Database = Db

let cached: Db | null = null

/**
 * Lazy singleton Drizzle client (Neon HTTP driver — stateless, serverless-friendly).
 * Created on first query so `process.env.DATABASE_URL` is read at request time.
 *
 * Note: the neon-http driver has no interactive transactions — use `db.batch([...])`
 * for multi-statement atomicity.
 */
export function getDb(): Db {
  if (!cached) cached = createDb()
  return cached
}

export { schema }
