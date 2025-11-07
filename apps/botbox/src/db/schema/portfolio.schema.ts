import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './users.schema'
import { exchanges } from './exchanges.schema'
import { numeric } from './types.schema'

export const portfolios = sqliteTable('portfolios', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  baseCurrency: text('base_currency').notNull().default('USDT'),
  totalValue: numeric('total_value', { precision: 20, scale: 8 })
    .notNull()
    .default(0),
  isDefault: int('is_default', { mode: 'boolean' }).notNull().default(false),
  lastSyncedAt: text('last_synced_at'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const portfolioHoldings = sqliteTable('portfolio_holdings', {
  id: int('id').primaryKey({ autoIncrement: true }),
  portfolioId: int('portfolio_id')
    .notNull()
    .references(() => portfolios.id, { onDelete: 'cascade' }),
  exchangeId: int('exchange_id')
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
