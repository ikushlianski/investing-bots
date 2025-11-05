import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const exchanges = sqliteTable('exchanges', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  apiUrl: text('api_url').notNull(),
  websocketUrl: text('websocket_url'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
