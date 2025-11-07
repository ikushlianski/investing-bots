import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { instruments } from './instruments.schema'
import { numeric } from './types.schema'

export const marketRegimes = sqliteTable('market_regimes', {
  id: int('id').primaryKey({ autoIncrement: true }),
  instrumentId: int('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(),
  regimeType: text('regime_type').notNull(),
  stillActive: int('still_active', { mode: 'boolean' }).notNull().default(true),
  trendStrength: numeric('trend_strength', { precision: 12, scale: 6 }),
  priceVsMa: numeric('price_vs_ma', { precision: 12, scale: 6 }),
  volatility: numeric('volatility', { precision: 12, scale: 6 }),
  startedAt: text('started_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  endedAt: text('ended_at'),
  parameters: text('parameters', { mode: 'json' }),
})
