import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { bots } from './core'
import { numeric } from './types'

export const pnlRecords = sqliteTable('pnl_records', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  pnl: numeric('pnl', { precision: 20, scale: 8 }).notNull(),
  timestamp: text('timestamp').notNull(),
})
