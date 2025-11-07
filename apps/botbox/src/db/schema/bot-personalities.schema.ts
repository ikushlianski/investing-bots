import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'
import { numeric } from './types'

export const botPersonalities = sqliteTable('bot_personalities', {
  id: int('id').primaryKey({ autoIncrement: true }),
  botId: int('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' })
    .unique(),
  personalityName: text('personality_name').notNull(),
  riskAppetite: numeric('risk_appetite', { precision: 4, scale: 2 })
    .notNull()
    .default(0.5),
  stopLossTightness: numeric('stop_loss_tightness', { precision: 4, scale: 2 })
    .notNull()
    .default(0.5),
  takeProfitAggressiveness: numeric('take_profit_aggressiveness', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default(0.5),
  entryPatience: numeric('entry_patience', { precision: 4, scale: 2 })
    .notNull()
    .default(0.5),
  entryConfidenceThreshold: numeric('entry_confidence_threshold', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default(0.7),
  trailStopAggressiveness: numeric('trail_stop_aggressiveness', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default(0.5),
  maxPositionSizePercent: numeric('max_position_size_percent', {
    precision: 6,
    scale: 2,
  })
    .notNull()
    .default(10),
  maxConcurrentPositions: int('max_concurrent_positions').notNull().default(3),
  minSetupQuality: numeric('min_setup_quality', { precision: 4, scale: 2 })
    .notNull()
    .default(0.6),
  preferredSetups: text('preferred_setups', { mode: 'json' }),
  regimePreference: text('regime_preference', { mode: 'json' }),
  startingCapital: numeric('starting_capital', { precision: 20, scale: 8 })
    .notNull()
    .default(100),
  currentCapital: numeric('current_capital', { precision: 20, scale: 8 })
    .notNull()
    .default(100),
  partialProfitTaking: int('partial_profit_taking', { mode: 'boolean' })
    .notNull()
    .default(false),
  breakevenMovement: numeric('breakeven_movement', { precision: 4, scale: 2 })
    .notNull()
    .default(0.5),
  maxDailyTrades: int('max_daily_trades'),
  volatilityTolerance: numeric('volatility_tolerance', {
    precision: 4,
    scale: 2,
  })
    .notNull()
    .default(0.5),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
