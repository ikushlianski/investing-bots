import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const exchanges = sqliteTable('exchanges', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  apiUrl: text('api_url').notNull(),
  websocketUrl: text('websocket_url'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const credentials = sqliteTable('credentials', {
  id: integer('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  exchangeId: integer('exchange_id')
    .notNull()
    .references(() => exchanges.id, { onDelete: 'cascade' }),
  apiKey: text('api_key').notNull(),
  apiSecret: text('api_secret').notNull(), // Note: Should be encrypted
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const instruments = sqliteTable('instruments', {
  id: integer('id').primaryKey(),
  symbol: text('symbol').notNull().unique(),
  name: text('name'),
  exchange: text('exchange').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const bots = sqliteTable('bots', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  status: text('status').notNull().default('inactive'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const botInstruments = sqliteTable(
  'bot_instruments',
  {
    botId: integer('bot_id')
      .notNull()
      .references(() => bots.id, { onDelete: 'cascade' }),
    instrumentId: integer('instrument_id')
      .notNull()
      .references(() => instruments.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey(t.botId, t.instrumentId),
  })
)
