import { config } from 'dotenv'
import { createDbConnection } from '../src/db/connection'
import { sql } from 'drizzle-orm'

config({ path: '.dev.vars' })

async function testConnection() {
  const db = createDbConnection(process.env.NEON_URL!)

  try {
    const result = await db.execute(sql`SELECT version()`)

    console.log('✓ Connected to database')
    console.log('PostgreSQL version:', result.rows[0].version)

    const tsdb = await db.execute(
      sql`SELECT * FROM pg_extension WHERE extname = 'timescaledb'`
    )

    if (tsdb.rows.length > 0) {
      console.log('✓ TimescaleDB extension is enabled')
    } else {
      console.log('✗ TimescaleDB extension NOT found')
    }

    const hypertable = await db.execute(sql`
      SELECT * FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'candles'
    `)

    if (hypertable.rows.length > 0) {
      console.log('✓ Candles hypertable is configured')
    } else {
      console.log('✗ Candles hypertable NOT found')
    }

    process.exit(0)
  } catch (error) {
    console.error('✗ Connection failed:', error)
    process.exit(1)
  }
}

testConnection()
