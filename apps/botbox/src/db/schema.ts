import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

// ——— CORE SCHEMA ———

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

export const botInstruments = sqliteTable('bot_instruments', {
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
})

// ——— STRATEGY SCHEMA ———

export const strategies = sqliteTable('strategies', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const strategyVersions = sqliteTable('strategy_versions', {
  id: integer('id').primaryKey(),
  strategyId: integer('strategy_id')
    .notNull()
    .references(() => strategies.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  config: text('config', { mode: 'json' }), // JSON object for strategy parameters
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const signals = sqliteTable('signals', {
  id: integer('id').primaryKey(),
  strategyVersionId: integer('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id),
  signalType: text('signal_type').notNull(), // e.g., 'entry', 'exit'
  indicator: text('indicator'),
  timestamp: text('timestamp').notNull(),
  processedAt: text('processed_at'),
  payload: text('payload', { mode: 'json' }), // Raw webhook payload
})

// ——— TRADING SCHEMA ———

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id),
  exchangeOrderId: text('exchange_order_id').unique(),
  status: text('status').notNull(), // e.g., 'open', 'filled', 'canceled'
  side: text('side').notNull(), // 'buy' or 'sell'
  type: text('type').notNull(), // 'market', 'limit'
  quantity: real('quantity').notNull(),
  price: real('price'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id),
  status: text('status').notNull().default('open'), // 'open', 'closed'
  entryPrice: real('entry_price').notNull(),
  exitPrice: real('exit_price'),
  size: real('size').notNull(),
  pnl: real('pnl'),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
})

export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  positionId: integer('position_id')
    .notNull()
    .references(() => positions.id),
  price: real('price').notNull(),
  quantity: real('quantity').notNull(),
  fee: real('fee'),
  timestamp: text('timestamp').notNull(),
})

// ——— RISK SCHEMA ———

export const riskConfigs = sqliteTable('risk_configs', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  maxPositionSize: real('max_position_size'),
  stopLossPercentage: real('stop_loss_percentage'),
  takeProfitPercentage: real('take_profit_percentage'),
  // Add other risk parameters as needed
})

// ——— ANALYTICS SCHEMA ———

export const pnlRecords = sqliteTable('pnl_records', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id),
  pnl: real('pnl').notNull(),
  timestamp: text('timestamp').notNull(),
})

// ——— AUDITING SCHEMA ———

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id').references(() => bots.id),
  level: text('level').notNull(), // 'info', 'warn', 'error'
  event: text('event').notNull(),
  message: text('message'),
  timestamp: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})
