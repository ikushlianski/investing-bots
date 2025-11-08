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
import { setups } from './setups.schema'
import { strategyMetrics } from './strategy-metrics.schema'
import { numeric } from './types.schema'

export const setupSignals = pgTable('setup_signals', {
  id: serial('id').primaryKey(),
  setupId: integer('setup_id')
    .notNull()
    .references(() => setups.id, { onDelete: 'cascade' }),
  metricId: integer('metric_id').references(() => strategyMetrics.id, {
    onDelete: 'set null',
  }),
  signalType: text('signal_type').notNull(),
  signalRole: text('signal_role').notNull(),
  detectedOnTimeframe: text('detected_on_timeframe').notNull(),
  firedAt: timestamp('fired_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  value: numeric('value', { precision: 12, scale: 6 }),
  threshold: numeric('threshold', { precision: 12, scale: 6 }),
  confidence: numeric('confidence', { precision: 6, scale: 4 }),
  stillValid: boolean('still_valid').notNull().default(true),
  invalidatedAt: timestamp('invalidated_at'),
  requiresRecheck: boolean('requires_recheck').notNull().default(true),
  lastRecheckedAt: timestamp('last_rechecked_at'),
  parameters: jsonb('parameters'),
})
