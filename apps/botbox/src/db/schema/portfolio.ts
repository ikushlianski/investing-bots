import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { exchanges } from './exchanges'
import { numeric } from './types'

export const portfolios = sqliteTable('portfolios', {
  id: integer('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  baseCurrency: text('base_currency').notNull().default('USDT'),
  totalValue: numeric('total_value', { precision: 20, scale: 8 })
    .notNull()
    .default(0),
  isDefault: integer('is_default', { mode: 'boolean' })
    .notNull()
    .default(false),
  lastSyncedAt: text('last_synced_at'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const portfolioHoldings = sqliteTable('portfolio_holdings', {
  id: integer('id').primaryKey(),
  portfolioId: integer('portfolio_id')
    .notNull()
    .references(() => portfolios.id, { onDelete: 'cascade' }),
  exchangeId: integer('exchange_id')
    .notNull()
    .references(() => exchanges.id, { onDelete: 'cascade' }),
  asset: text('asset').notNull(),
  free: numeric('free', { precision: 20, scale: 8 }).notNull().default(0),
  locked: numeric('locked', { precision: 20, scale: 8 }).notNull().default(0),
  total: numeric('total', { precision: 20, scale: 8 }).notNull().default(0),
  averageBuyPrice: numeric('average_buy_price', { precision: 20, scale: 8 }),
  currentPrice: numeric('current_price', { precision: 20, scale: 8 }),
  exchangeMetadata: text('exchange_metadata', { mode: 'json' }),
  lastSyncedAt: text('last_synced_at'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
