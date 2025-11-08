import { sql } from 'drizzle-orm'
import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { bots } from './bots.schema'
import { instruments } from './instruments.schema'
import { credentials } from './credentials.schema'
import { setups } from './setups.schema'
import { signals, strategyVersions } from './strategy.schema'
import { numeric } from './types.schema'

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
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
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  price: numeric('price', { precision: 20, scale: 8 }).notNull(),
  quantity: numeric('quantity', { precision: 20, scale: 8 }).notNull(),
  filledQuantity: numeric('filled_quantity', {
    precision: 20,
    scale: 8,
  }).default('0'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
