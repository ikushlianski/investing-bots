import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core'
import { bots } from './bots.schema'
import { numeric } from './types.schema'

export const pnlRecords = sqliteTable('pnl_records', {
  id: int('id').primaryKey({ autoIncrement: true }),
  botId: int('bot_id')
    .notNull()
    .references(() => bots.id),
  pnl: numeric('pnl', { precision: 20, scale: 8 }).notNull(),
  timestamp: text('timestamp').notNull(),
})
