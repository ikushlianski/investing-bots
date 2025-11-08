import { sql } from 'drizzle-orm'
import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.schema'
import { exchanges } from './exchanges.schema'

export const credentials = pgTable('credentials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  exchangeId: integer('exchange_id')
    .notNull()
    .references(() => exchanges.id, { onDelete: 'cascade' }),
  apiKey: text('api_key').notNull(),
  apiSecret: text('api_secret').notNull(),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
