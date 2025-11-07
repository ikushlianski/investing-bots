import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'
import { instruments } from './instruments'
import { credentials } from './credentials'
import { setups } from './setups'
import { signals, strategyVersions } from './strategy'
import { numeric } from './types'

export const orders = sqliteTable('orders', {
  id: int('id').primaryKey({ autoIncrement: true }),
  botId: int('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  instrumentId: int('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  setupId: int('setup_id').references(() => setups.id),
  signalId: int('signal_id').references(() => signals.id),
  strategyVersionId: int('strategy_version_id').references(
    () => strategyVersions.id
  ),
  credentialId: int('credential_id').references(() => credentials.id),
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
