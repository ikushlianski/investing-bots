import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { strategyVersions } from './strategy.schema'
import { setupSignals } from './setup-signals.schema'
import { bots } from './bots.schema'
import { numeric } from './types.schema'

export const strategyMetrics = pgTable('strategy_metrics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull(),
  description: text('description'),
  unit: text('unit').notNull(),
  minValue: numeric('min_value', { precision: 20, scale: 8 }),
  maxValue: numeric('max_value', { precision: 20, scale: 8 }),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const strategyVersionMetrics = pgTable(
  'strategy_version_metrics',
  {
    strategyVersionId: integer('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    metricId: integer('metric_id')
      .notNull()
      .references(() => strategyMetrics.id, { onDelete: 'cascade' }),
    thresholdValue: numeric('threshold_value', { precision: 20, scale: 8 }),
    operator: text('operator').notNull(),
    isRequired: boolean('is_required').notNull().default(true),
    priority: integer('priority').notNull().default(1),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.strategyVersionId, t.metricId] })]
)

export const setupSignalMetrics = pgTable('setup_signal_metrics', {
  id: serial('id').primaryKey(),
  setupSignalId: integer('setup_signal_id')
    .notNull()
    .references(() => setupSignals.id, { onDelete: 'cascade' }),
  metricId: integer('metric_id')
    .notNull()
    .references(() => strategyMetrics.id, { onDelete: 'cascade' }),
  value: numeric('value', { precision: 20, scale: 8 }).notNull(),
  thresholdValue: numeric('threshold_value', { precision: 20, scale: 8 }),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const strategyPerformanceMetrics = pgTable(
  'strategy_performance_metrics',
  {
    id: serial('id').primaryKey(),
    strategyVersionId: integer('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    botId: integer('bot_id').references(() => bots.id, { onDelete: 'cascade' }),
    metricType: text('metric_type').notNull(),
    value: numeric('value', { precision: 20, scale: 8 }).notNull(),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    calculatedAt: timestamp('calculated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    metadata: jsonb('metadata'),
  }
)
