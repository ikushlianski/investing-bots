import { sql } from 'drizzle-orm'
import { int, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { users } from './users.schema'
import { exchanges } from './exchanges.schema'
import { instruments } from './instruments.schema'
import { strategyVersions } from './strategy.schema'

export const bots = sqliteTable('bots', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  personalityName: text('personality_name'),
  exchangeId: int('exchange_id').references(() => exchanges.id, {
    onDelete: 'cascade',
  }),
  strategyVersionId: int('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('inactive'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const botInstruments = sqliteTable(
  'bot_instruments',
  {
    botId: int('bot_id')
      .notNull()
      .references(() => bots.id, { onDelete: 'cascade' }),
    instrumentId: int('instrument_id')
      .notNull()
      .references(() => instruments.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.botId, t.instrumentId] })]
)
