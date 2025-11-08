import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'
import { strategies } from './strategies.schema'
import { setups } from './setups.schema'

export const strategyVersions = pgTable('strategy_versions', {
  id: serial('id').primaryKey(),
  strategyId: integer('strategy_id')
    .notNull()
    .references(() => strategies.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  config: jsonb('config'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const signals = pgTable('signals', {
  id: serial('id').primaryKey(),
  strategyVersionId: integer('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id),
  setupId: integer('setup_id').references(() => setups.id),
  signalType: text('signal_type').notNull(),
  indicator: text('indicator'),
  timestamp: timestamp('timestamp').notNull(),
  processedAt: timestamp('processed_at'),
  payload: jsonb('payload'),
})
