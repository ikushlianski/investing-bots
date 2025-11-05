import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'
import { instruments } from './instruments'
import { setups } from './setups'
import { orders } from './orders'
import { positions } from './trading'
import { numeric } from './types'

export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey(),
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
  direction: text('direction').notNull(), // 'LONG' or 'SHORT'
  entryPrice: numeric('entry_price', { precision: 20, scale: 8 }).notNull(),
  quantity: numeric('quantity', { precision: 20, scale: 8 }).notNull(),
  stopLoss: numeric('stop_loss', { precision: 20, scale: 8 }).notNull(),
  takeProfit1: numeric('take_profit_1', { precision: 20, scale: 8 }),
  takeProfit2: numeric('take_profit_2', { precision: 20, scale: 8 }),
  entryTime: text('entry_time')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  exitTime: text('exit_time'),
  exitPrice: numeric('exit_price', { precision: 20, scale: 8 }),
  exitReason: text('exit_reason'),
  realizedPnl: numeric('realized_pnl', { precision: 20, scale: 8 }),
  realizedPnlPercent: numeric('realized_pnl_percent', {
    precision: 10,
    scale: 4,
  }),
  stopMovedToBreakeven: integer('stop_moved_to_breakeven', { mode: 'boolean' })
    .notNull()
    .default(false),
  status: text('status').notNull().default('OPEN'),
  triggerSignals: text('trigger_signals', { mode: 'json' }),
})
