import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { strategies } from './strategies'

export const strategyVersions = sqliteTable('strategy_versions', {
  id: integer('id').primaryKey(),
  strategyId: integer('strategy_id')
    .notNull()
    .references(() => strategies.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  config: text('config', { mode: 'json' }), // JSON object for strategy parameters
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const signals = sqliteTable('signals', {
  id: integer('id').primaryKey(),
  strategyVersionId: integer('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id),
  signalType: text('signal_type').notNull(), // e.g., 'entry', 'exit'
  indicator: text('indicator'),
  timestamp: text('timestamp').notNull(),
  processedAt: text('processed_at'),
  payload: text('payload', { mode: 'json' }), // Raw webhook payload
})
