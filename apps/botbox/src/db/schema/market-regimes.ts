import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { instruments } from './instruments'
import { numeric } from './types'

export const marketRegimes = sqliteTable('market_regimes', {
  id: integer('id').primaryKey(),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(),
  regimeType: text('regime_type').notNull(),
  stillActive: integer('still_active', { mode: 'boolean' })
    .notNull()
    .default(true),
  trendStrength: numeric('trend_strength', { precision: 12, scale: 6 }),
  priceVsMa: numeric('price_vs_ma', { precision: 12, scale: 6 }),
  volatility: numeric('volatility', { precision: 12, scale: 6 }),
  startedAt: text('started_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  endedAt: text('ended_at'),
  parameters: text('parameters', { mode: 'json' }),
})
