import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'

import * as schema from './schema'

import type { NeonDatabase } from 'drizzle-orm/neon-serverless'

type Database = NeonDatabase<typeof schema>

let cachedDb: Database | undefined
let cachedPool: Pool | undefined

const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  return url
}

export const getDb = createServerOnlyFn(() => {
  if (cachedDb) {
    return cachedDb
  }

  if (!cachedPool) {
    cachedPool = new Pool({ connectionString: getDatabaseUrl() })
  }

  const db = drizzle({ client: cachedPool, schema }) as Database

  cachedDb = db

  return cachedDb
})
