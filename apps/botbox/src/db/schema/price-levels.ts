import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { instruments } from './instruments'
import { numeric } from './types'

export const priceLevels = sqliteTable('price_levels', {
  id: integer('id').primaryKey(),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(),
  levelType: text('level_type').notNull(),
  price: numeric('price', { precision: 20, scale: 8 }).notNull(),
  strength: integer('strength').notNull().default(1),
  tests: integer('tests').notNull().default(1),
  stillValid: integer('still_valid', { mode: 'boolean' })
    .notNull()
    .default(true),
  firstTestedAt: text('first_tested_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastTestedAt: text('last_tested_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  invalidatedAt: text('invalidated_at'),
  parameters: text('parameters', { mode: 'json' }),
})
