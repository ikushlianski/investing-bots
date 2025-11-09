import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool, neonConfig } from '@neondatabase/serverless'

import * as schema from './schema'

import type { NeonDatabase } from 'drizzle-orm/neon-serverless'

type Database = NeonDatabase<typeof schema>

let cachedDb: Database | undefined
let cachedPool: Pool | undefined

neonConfig.webSocketConstructor = WebSocket

const getDatabaseUrl = (): string => {
  const url = process.env.NEON_URL

  if (!url) {
    throw new Error(
      'NEON_URL environment variable is not set. Please check your .env or .dev.vars file.'
    )
  }

  return url
}

const createConnectionPool = (): Pool => {
  const connectionString = getDatabaseUrl()

  return new Pool({ connectionString })
}

const initializeDatabase = (): Database => {
  if (!cachedPool) {
    cachedPool = createConnectionPool()
  }

  return drizzle({ client: cachedPool, schema }) as Database
}

export const getDb = createServerOnlyFn(() => {
  if (cachedDb) {
    return cachedDb
  }

  cachedDb = initializeDatabase()

  return cachedDb
})
