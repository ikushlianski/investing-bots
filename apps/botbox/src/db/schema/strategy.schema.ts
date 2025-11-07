import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { strategies } from './strategies.schema'
import { setups } from './setups.schema'

export const strategyVersions = sqliteTable('strategy_versions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  strategyId: int('strategy_id')
    .notNull()
    .references(() => strategies.id, { onDelete: 'cascade' }),
  version: int('version').notNull(),
  /**
   * @deprecated Use strategyVersionMetrics table instead.
   * This JSON field is kept for backward compatibility but strategy parameters
   * should be stored in the strategyVersionMetrics table for better queryability
   * and editability.
   */
  config: text('config', { mode: 'json' }),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const signals = sqliteTable('signals', {
  id: int('id').primaryKey({ autoIncrement: true }),
  strategyVersionId: int('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id),
  setupId: int('setup_id').references(() => setups.id),
  signalType: text('signal_type').notNull(), // e.g., 'entry', 'exit'
  indicator: text('indicator'),
  timestamp: text('timestamp').notNull(),
  processedAt: text('processed_at'),
  payload: text('payload', { mode: 'json' }), // Raw webhook payload
})
