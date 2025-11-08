import { sql } from 'drizzle-orm'
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const exchanges = pgTable('exchanges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  apiUrl: text('api_url').notNull(),
  websocketUrl: text('websocket_url'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
