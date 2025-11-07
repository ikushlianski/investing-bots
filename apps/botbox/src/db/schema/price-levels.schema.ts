import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { instruments } from './instruments.schema'
import { numeric } from './types.schema'

export const priceLevels = sqliteTable('price_levels', {
  id: int('id').primaryKey({ autoIncrement: true }),
  instrumentId: int('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(),
  levelType: text('level_type').notNull(),
  price: numeric('price', { precision: 20, scale: 8 }).notNull(),
  strength: int('strength').notNull().default(1),
  tests: int('tests').notNull().default(1),
  stillValid: int('still_valid', { mode: 'boolean' }).notNull().default(true),
  firstTestedAt: text('first_tested_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastTestedAt: text('last_tested_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  invalidatedAt: text('invalidated_at'),
  parameters: text('parameters', { mode: 'json' }),
})
