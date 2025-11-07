import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { bots } from './bots.schema'

export const auditLogs = sqliteTable('audit_logs', {
  id: int('id').primaryKey({ autoIncrement: true }),
  botId: int('bot_id').references(() => bots.id),
  level: text('level').notNull(),
  event: text('event').notNull(),
  message: text('message'),
  timestamp: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
