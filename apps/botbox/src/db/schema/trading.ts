import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'
import { bots, instruments } from './core'
import { orders } from './orders'

export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id),
  status: text('status').notNull().default('open'), // 'open', 'closed'
  entryPrice: real('entry_price').notNull(),
  exitPrice: real('exit_price'),
  size: real('size').notNull(),
  pnl: real('pnl'),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
})

export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  positionId: integer('position_id')
    .notNull()
    .references(() => positions.id),
  price: real('price').notNull(),
  quantity: real('quantity').notNull(),
  fee: real('fee'),
  timestamp: text('timestamp').notNull(),
})
