import { sql } from 'drizzle-orm'
import { pgTable, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { bots } from './bots.schema'
import { strategyVersions } from './strategy.schema'
import { numeric } from './types.schema'

export const botStrategies = pgTable(
  'bot_strategies',
  {
    botId: integer('bot_id')
      .notNull()
      .references(() => bots.id, { onDelete: 'cascade' }),
    strategyVersionId: integer('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    priority: integer('priority').notNull().default(1),
    weight: numeric('weight', { precision: 6, scale: 4 })
      .notNull()
      .default('1'),
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.botId, t.strategyVersionId] })]
)
