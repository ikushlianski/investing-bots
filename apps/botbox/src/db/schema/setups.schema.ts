import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { instruments } from './instruments.schema'
import { marketRegimes } from './market-regimes.schema'
import { strategyVersions } from './strategy.schema'
import { numeric } from './types.schema'

export const setups = sqliteTable('setups', {
  id: int('id').primaryKey({ autoIncrement: true }),
  instrumentId: int('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  entryTimeframe: text('entry_timeframe').notNull(),
  contextTimeframe: text('context_timeframe'),
  setupType: text('setup_type').notNull(),
  direction: text('direction').notNull(),
  state: text('state').notNull().default('FORMING'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  activatedAt: text('activated_at'),
  triggeredAt: text('triggered_at'),
  expiresAt: text('expires_at').notNull(),
  formingDurationMinutes: int('forming_duration_minutes').notNull(),
  activeDurationMinutes: int('active_duration_minutes').notNull(),
  candlesElapsed: int('candles_elapsed').notNull().default(0),
  entryZoneLow: numeric('entry_zone_low', {
    precision: 20,
    scale: 8,
  }).notNull(),
  entryZoneHigh: numeric('entry_zone_high', {
    precision: 20,
    scale: 8,
  }).notNull(),
  stopLoss: numeric('stop_loss', { precision: 20, scale: 8 }).notNull(),
  takeProfit1: numeric('take_profit_1', { precision: 20, scale: 8 }),
  takeProfit2: numeric('take_profit_2', { precision: 20, scale: 8 }),
  takeProfit3: numeric('take_profit_3', { precision: 20, scale: 8 }),
  regimeId: int('regime_id').references(() => marketRegimes.id),
  contextRegimeId: int('context_regime_id').references(() => marketRegimes.id),
  strategyVersionId: int('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id, { onDelete: 'cascade' }),
  riskRewardRatio: numeric('risk_reward_ratio', { precision: 8, scale: 4 }),
  positionSizePlanned: numeric('position_size_planned', {
    precision: 20,
    scale: 8,
  }),
  requiredConfirmations: int('required_confirmations').notNull().default(3),
  parameters: text('parameters', { mode: 'json' }),
  invalidatedAt: text('invalidated_at'),
  invalidationReason: text('invalidation_reason'),
})
