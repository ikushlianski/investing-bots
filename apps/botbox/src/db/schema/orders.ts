import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'
import { bots, instruments } from './core'

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'buy' or 'sell'
  status: text('status').notNull().default('pending'), // 'pending', 'filled', 'cancelled', 'rejected'
  price: real('price').notNull(),
  quantity: real('quantity').notNull(),
  filledQuantity: real('filled_quantity').default(0),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
