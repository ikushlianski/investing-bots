import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id').references(() => bots.id),
  level: text('level').notNull(),
  event: text('event').notNull(),
  message: text('message'),
  timestamp: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
