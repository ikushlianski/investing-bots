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
import { bots } from './bots.schema'
import { numeric } from './types.schema'

export const botPersonalities = pgTable('bot_personalities', {
  id: serial('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' })
    .unique(),
  personalityName: text('personality_name').notNull(),
  riskAppetite: numeric('risk_appetite', { precision: 4, scale: 2 })
    .notNull()
    .default('0.5'),
  stopLossTightness: numeric('stop_loss_tightness', { precision: 4, scale: 2 })
    .notNull()
    .default('0.5'),
  takeProfitAggressiveness: numeric('take_profit_aggressiveness', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default('0.5'),
  entryPatience: numeric('entry_patience', { precision: 4, scale: 2 })
    .notNull()
    .default('0.5'),
  entryConfidenceThreshold: numeric('entry_confidence_threshold', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default('0.7'),
  trailStopAggressiveness: numeric('trail_stop_aggressiveness', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default('0.5'),
  maxPositionSizePercent: numeric('max_position_size_percent', {
    precision: 6,
    scale: 2,
  })
    .notNull()
    .default('10'),
  maxConcurrentPositions: integer('max_concurrent_positions')
    .notNull()
    .default(3),
  minSetupQuality: numeric('min_setup_quality', { precision: 4, scale: 2 })
    .notNull()
    .default('0.6'),
  preferredSetups: jsonb('preferred_setups'),
  regimePreference: jsonb('regime_preference'),
  startingCapital: numeric('starting_capital', { precision: 20, scale: 8 })
    .notNull()
    .default('100'),
  currentCapital: numeric('current_capital', { precision: 20, scale: 8 })
    .notNull()
    .default('100'),
  partialProfitTaking: boolean('partial_profit_taking')
    .notNull()
    .default(false),
  breakevenMovement: numeric('breakeven_movement', { precision: 4, scale: 2 })
    .notNull()
    .default('0.5'),
  maxDailyTrades: integer('max_daily_trades'),
  volatilityTolerance: numeric('volatility_tolerance', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default('0.5'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
