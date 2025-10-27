import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'
import { bots } from './core'

export const pnlRecords = sqliteTable('pnl_records', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  pnl: real('pnl').notNull(),
  timestamp: text('timestamp').notNull(),
})
