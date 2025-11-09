import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-serverless'
import type { NeonDatabase } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from '../src/db/schema'
import { seedUser } from './seed-user'

type Database = NeonDatabase<typeof schema>

const getDatabase = (): { db: Database; pool: Pool } => {
  const neonUrl = process.env.NEON_URL

  if (!neonUrl) {
    throw new Error('NEON_URL environment variable is not set')
  }

  const pool = new Pool({ connectionString: neonUrl })
  const db = drizzle({ client: pool, schema }) as Database

  return { db, pool }
}

export type SeedDatabase = Database

const seed = async () => {
  const { db, pool } = getDatabase()

  try {
    console.log('Starting database seed...\n')

    await seedUser(db)

    console.log('\nDatabase seed completed successfully.')
  } catch (error) {
    console.error('Error during seed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

seed().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
