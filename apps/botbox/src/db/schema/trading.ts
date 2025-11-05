import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'
import { instruments } from './instruments'
import { setups } from './setups'
import { strategyVersions } from './strategy'
import { numeric } from './types'

export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey(),
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
  status: text('status').notNull().default('open'), // 'open', 'closed'
  entryPrice: numeric('entry_price', { precision: 20, scale: 8 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 20, scale: 8 }),
  size: numeric('size', { precision: 20, scale: 8 }).notNull(),
  pnl: numeric('pnl', { precision: 20, scale: 8 }),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
})
