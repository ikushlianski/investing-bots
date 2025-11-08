import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'
import { instruments } from './instruments.schema'
import { marketRegimes } from './market-regimes.schema'
import { strategyVersions } from './strategy.schema'
import { numeric } from './types.schema'

export const setups = pgTable('setups', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  entryTimeframe: text('entry_timeframe').notNull(),
  contextTimeframe: text('context_timeframe'),
  setupType: text('setup_type').notNull(),
  direction: text('direction').notNull(),
  state: text('state').notNull().default('FORMING'),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  activatedAt: timestamp('activated_at'),
  triggeredAt: timestamp('triggered_at'),
  expiresAt: timestamp('expires_at').notNull(),
  formingDurationMinutes: integer('forming_duration_minutes').notNull(),
  activeDurationMinutes: integer('active_duration_minutes').notNull(),
  candlesElapsed: integer('candles_elapsed').notNull().default(0),
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
  regimeId: integer('regime_id').references(() => marketRegimes.id),
  contextRegimeId: integer('context_regime_id').references(
    () => marketRegimes.id
  ),
  strategyVersionId: integer('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id, { onDelete: 'cascade' }),
  riskRewardRatio: numeric('risk_reward_ratio', { precision: 8, scale: 4 }),
  positionSizePlanned: numeric('position_size_planned', {
    precision: 20,
    scale: 8,
  }),
  requiredConfirmations: integer('required_confirmations').notNull().default(3),
  parameters: jsonb('parameters'),
  invalidatedAt: timestamp('invalidated_at'),
  invalidationReason: text('invalidation_reason'),
})
