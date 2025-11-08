import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { users } from './users.schema'
import { exchanges } from './exchanges.schema'
import { instruments } from './instruments.schema'
import { strategyVersions } from './strategy.schema'

export const bots = pgTable('bots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  personalityName: text('personality_name'),
  exchangeId: integer('exchange_id').references(() => exchanges.id, {
    onDelete: 'cascade',
  }),
  strategyVersionId: integer('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('inactive'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const botInstruments = pgTable(
  'bot_instruments',
  {
    botId: integer('bot_id')
      .notNull()
      .references(() => bots.id, { onDelete: 'cascade' }),
    instrumentId: integer('instrument_id')
      .notNull()
      .references(() => instruments.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.botId, t.instrumentId] })]
)
