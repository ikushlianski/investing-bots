import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema'

import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { D1Database } from '@cloudflare/workers-types'

type CloudflareModule = { env: { DB?: unknown } }
type Database = DrizzleD1Database<typeof schema>

let cachedDb: Database | undefined

const hasDbBinding = (value: unknown): value is { DB?: unknown } => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'DB' in value
}

const loadCloudflareBinding = async (): Promise<unknown> => {
  try {
    const module = (await import('cloudflare:workers')) as CloudflareModule
    const binding = module.env.DB

    if (binding) {
      return binding
    }

    return undefined
  } catch {
    return undefined
  }
}

const resolveDatabaseBinding = async (): Promise<unknown> => {
  if (hasDbBinding(globalThis)) {
    const binding = (globalThis as { DB?: unknown }).DB

    if (binding) {
      return binding
    }
  }

  const binding = await loadCloudflareBinding()

  if (binding) {
    return binding
  }

  throw new Error('DB binding is not available in the current environment')
}

export const getDb = createServerOnlyFn(async () => {
  if (cachedDb) {
    return cachedDb
  }

  const db = drizzle((await resolveDatabaseBinding()) as D1Database, {
    schema,
  }) as Database

  cachedDb = db

  return cachedDb
})
