import { sql } from 'drizzle-orm'
import { int, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'
import { strategyVersions } from './strategy'
import { numeric } from './types'

/**
 * Many-to-many relationship between bots and strategies.
 *
 * NOTE: Currently, application logic uses a single strategy per bot (via bots.strategyVersionId).
 * This table is reserved for future multi-strategy support where a bot can select
 * between multiple strategies dynamically.
 */
export const botStrategies = sqliteTable(
  'bot_strategies',
  {
    botId: int('bot_id')
      .notNull()
      .references(() => bots.id, { onDelete: 'cascade' }),
    strategyVersionId: int('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    priority: int('priority').notNull().default(1),
    weight: numeric('weight', { precision: 6, scale: 4 }).notNull().default(1),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.botId, t.strategyVersionId] })]
)
