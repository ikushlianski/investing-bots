import { sql } from 'drizzle-orm'
import { int, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { strategyVersions } from './strategy.schema'
import { setupSignals } from './setup-signals.schema'
import { bots } from './bots.schema'
import { numeric } from './types.schema'

/**
 * Metric definitions that strategies can use.
 * Examples: RSI, ADX, Bollinger Bands, Moving Averages, etc.
 */
export const strategyMetrics = sqliteTable('strategy_metrics', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  type: text('type').notNull(), // 'oscillator', 'trend', 'volatility', 'volume', 'price_action'
  description: text('description'),
  unit: text('unit').notNull(), // 'percent', 'absolute', 'ratio', 'price', 'count'
  minValue: numeric('min_value', { precision: 20, scale: 8 }),
  maxValue: numeric('max_value', { precision: 20, scale: 8 }),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

/**
 * Links strategy versions to their required metrics with thresholds/values.
 * This defines which metrics are critical for a strategy and what values they need.
 * A strategy is composed of these metrics - only metrics listed here are considered.
 */
export const strategyVersionMetrics = sqliteTable(
  'strategy_version_metrics',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    strategyVersionId: int('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    metricId: int('metric_id')
      .notNull()
      .references(() => strategyMetrics.id, { onDelete: 'cascade' }),
    thresholdValue: numeric('threshold_value', { precision: 20, scale: 8 }),
    operator: text('operator').notNull(), // '<', '>', '<=', '>=', '==', '!=', 'between'
    isRequired: int('is_required', { mode: 'boolean' }).notNull().default(true),
    priority: int('priority').notNull().default(1),
    metadata: text('metadata', { mode: 'json' }),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.strategyVersionId, t.metricId] })]
)

/**
 * Links setup signals to the metrics that triggered them.
 * Tracks which specific metrics (and their values) caused a signal to fire.
 */
export const setupSignalMetrics = sqliteTable('setup_signal_metrics', {
  id: int('id').primaryKey({ autoIncrement: true }),
  setupSignalId: int('setup_signal_id')
    .notNull()
    .references(() => setupSignals.id, { onDelete: 'cascade' }),
  metricId: int('metric_id')
    .notNull()
    .references(() => strategyMetrics.id, { onDelete: 'cascade' }),
  value: numeric('value', { precision: 20, scale: 8 }).notNull(),
  thresholdValue: numeric('threshold_value', { precision: 20, scale: 8 }),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

/**
 * Stores performance metrics for strategies and bots.
 * Tracks win rate, Sharpe ratio, max drawdown, profit factor, etc.
 * Can be strategy-wide (botId is null) or bot-specific (botId is set).
 */
export const strategyPerformanceMetrics = sqliteTable(
  'strategy_performance_metrics',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    strategyVersionId: int('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    botId: int('bot_id').references(() => bots.id, { onDelete: 'cascade' }),
    metricType: text('metric_type').notNull(), // 'win_rate', 'sharpe_ratio', 'max_drawdown', 'profit_factor', 'expectancy', etc.
    value: numeric('value', { precision: 20, scale: 8 }).notNull(),
    periodStart: text('period_start').notNull(),
    periodEnd: text('period_end').notNull(),
    calculatedAt: text('calculated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    metadata: text('metadata', { mode: 'json' }),
  }
)
