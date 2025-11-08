import { sql } from 'drizzle-orm'
import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { bots } from './bots.schema'

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  botId: integer('bot_id').references(() => bots.id),
  level: text('level').notNull(),
  event: text('event').notNull(),
  message: text('message'),
  timestamp: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
