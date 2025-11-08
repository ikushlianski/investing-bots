import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { bots } from './bots.schema'
import { instruments } from './instruments.schema'
import { setups } from './setups.schema'
import { strategyVersions } from './strategy.schema'
import { numeric } from './types.schema'

export const positions = pgTable('positions', {
  id: serial('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id),
  setupId: integer('setup_id').references(() => setups.id),
  strategyVersionId: integer('strategy_version_id').references(
    () => strategyVersions.id
  ),
  status: text('status').notNull().default('open'),
  entryPrice: numeric('entry_price', { precision: 20, scale: 8 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 20, scale: 8 }),
  size: numeric('size', { precision: 20, scale: 8 }).notNull(),
  pnl: numeric('pnl', { precision: 20, scale: 8 }),
  openedAt: timestamp('opened_at').notNull(),
  closedAt: timestamp('closed_at'),
})
