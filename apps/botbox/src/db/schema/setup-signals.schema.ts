import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { setups } from './setups.schema'
import { strategyMetrics } from './strategy-metrics.schema'
import { numeric } from './types.schema'

export const setupSignals = sqliteTable('setup_signals', {
  id: int('id').primaryKey({ autoIncrement: true }),
  setupId: int('setup_id')
    .notNull()
    .references(() => setups.id, { onDelete: 'cascade' }),
  metricId: int('metric_id').references(() => strategyMetrics.id, {
    onDelete: 'set null',
  }),
  signalType: text('signal_type').notNull(),
  signalRole: text('signal_role').notNull(),
  detectedOnTimeframe: text('detected_on_timeframe').notNull(),
  firedAt: text('fired_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  value: numeric('value', { precision: 12, scale: 6 }),
  threshold: numeric('threshold', { precision: 12, scale: 6 }),
  confidence: numeric('confidence', { precision: 6, scale: 4 }),
  stillValid: int('still_valid', { mode: 'boolean' }).notNull().default(true),
  invalidatedAt: text('invalidated_at'),
  requiresRecheck: int('requires_recheck', { mode: 'boolean' })
    .notNull()
    .default(true),
  lastRecheckedAt: text('last_rechecked_at'),
  parameters: text('parameters', { mode: 'json' }),
})
