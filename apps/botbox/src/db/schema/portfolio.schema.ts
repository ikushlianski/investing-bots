import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'
import { users } from './users.schema'
import { exchanges } from './exchanges.schema'
import { numeric } from './types.schema'

export const portfolios = pgTable('portfolios', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  baseCurrency: text('base_currency').notNull().default('USDT'),
  totalValue: numeric('total_value', { precision: 20, scale: 8 })
    .notNull()
    .default('0'),
  isDefault: boolean('is_default').notNull().default(false),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const portfolioHoldings = pgTable('portfolio_holdings', {
  id: serial('id').primaryKey(),
  portfolioId: integer('portfolio_id')
    .notNull()
    .references(() => portfolios.id, { onDelete: 'cascade' }),
  exchangeId: integer('exchange_id')
    .notNull()
    .references(() => exchanges.id, { onDelete: 'cascade' }),
  asset: text('asset').notNull(),
  free: numeric('free', { precision: 20, scale: 8 }).notNull().default('0'),
  locked: numeric('locked', { precision: 20, scale: 8 }).notNull().default('0'),
  total: numeric('total', { precision: 20, scale: 8 }).notNull().default('0'),
  averageBuyPrice: numeric('average_buy_price', { precision: 20, scale: 8 }),
  currentPrice: numeric('current_price', { precision: 20, scale: 8 }),
  exchangeMetadata: jsonb('exchange_metadata'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
