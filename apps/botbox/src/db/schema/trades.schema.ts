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
import { instruments } from './instruments.schema'
import { setups } from './setups.schema'
import { orders } from './orders.schema'
import { positions } from './trading.schema'
import { numeric } from './types.schema'

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  setupId: integer('setup_id')
    .notNull()
    .references(() => setups.id, { onDelete: 'cascade' }),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  entryOrderId: integer('entry_order_id').references(() => orders.id),
  exitOrderId: integer('exit_order_id').references(() => orders.id),
  positionId: integer('position_id').references(() => positions.id),
  direction: text('direction').notNull(),
  entryPrice: numeric('entry_price', { precision: 20, scale: 8 }).notNull(),
  quantity: numeric('quantity', { precision: 20, scale: 8 }).notNull(),
  stopLoss: numeric('stop_loss', { precision: 20, scale: 8 }).notNull(),
  takeProfit1: numeric('take_profit_1', { precision: 20, scale: 8 }),
  takeProfit2: numeric('take_profit_2', { precision: 20, scale: 8 }),
  entryTime: timestamp('entry_time')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  exitTime: timestamp('exit_time'),
  exitPrice: numeric('exit_price', { precision: 20, scale: 8 }),
  exitReason: text('exit_reason'),
  realizedPnl: numeric('realized_pnl', { precision: 20, scale: 8 }),
  realizedPnlPercent: numeric('realized_pnl_percent', {
    precision: 10,
    scale: 4,
  }),
  stopMovedToBreakeven: boolean('stop_moved_to_breakeven')
    .notNull()
    .default(false),
  status: text('status').notNull().default('OPEN'),
  triggerSignals: jsonb('trigger_signals'),
})
