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

export const marketRegimes = pgTable('market_regimes', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(),
  regimeType: text('regime_type').notNull(),
  stillActive: boolean('still_active').notNull().default(true),
  trendStrength: numeric('trend_strength', { precision: 12, scale: 6 }),
  priceVsMa: numeric('price_vs_ma', { precision: 12, scale: 6 }),
  volatility: numeric('volatility', { precision: 12, scale: 6 }),
  startedAt: timestamp('started_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  endedAt: timestamp('ended_at'),
  parameters: jsonb('parameters'),
})
