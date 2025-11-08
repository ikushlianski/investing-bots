import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'
import { instruments } from './instruments.schema'
import { numeric } from './types.schema'

export const priceLevels = pgTable('price_levels', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(),
  levelType: text('level_type').notNull(),
  price: numeric('price', { precision: 20, scale: 8 }).notNull(),
  strength: integer('strength').notNull().default(1),
  tests: integer('tests').notNull().default(1),
  stillValid: boolean('still_valid').notNull().default(true),
  firstTestedAt: timestamp('first_tested_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastTestedAt: timestamp('last_tested_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  invalidatedAt: timestamp('invalidated_at'),
  parameters: jsonb('parameters'),
})
