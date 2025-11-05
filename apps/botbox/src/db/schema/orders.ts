import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'
import { instruments } from './instruments'
import { credentials } from './credentials'
import { setups } from './setups'
import { signals, strategyVersions } from './strategy'
import { numeric } from './types'

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  setupId: integer('setup_id').references(() => setups.id),
  signalId: integer('signal_id').references(() => signals.id),
  strategyVersionId: integer('strategy_version_id').references(
    () => strategyVersions.id
  ),
  credentialId: integer('credential_id').references(() => credentials.id),
  type: text('type').notNull(), // 'buy' or 'sell'
  status: text('status').notNull().default('pending'), // 'pending', 'filled', 'cancelled', 'rejected'
  price: numeric('price', { precision: 20, scale: 8 }).notNull(),
  quantity: numeric('quantity', { precision: 20, scale: 8 }).notNull(),
  filledQuantity: numeric('filled_quantity', {
    precision: 20,
    scale: 8,
  }).default(0),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
