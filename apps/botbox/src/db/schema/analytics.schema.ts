import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core'
import { bots } from './bots.schema'
import { numeric } from './types.schema'

export const pnlRecords = pgTable('pnl_records', {
  id: serial('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  pnl: numeric('pnl', { precision: 20, scale: 8 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
})
