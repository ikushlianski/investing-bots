import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './users.schema'
import { exchanges } from './exchanges.schema'

export const credentials = sqliteTable('credentials', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  exchangeId: int('exchange_id')
    .notNull()
    .references(() => exchanges.id, { onDelete: 'cascade' }),
  apiKey: text('api_key').notNull(),
  apiSecret: text('api_secret').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
