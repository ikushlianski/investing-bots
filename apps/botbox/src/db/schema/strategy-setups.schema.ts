import { sql } from 'drizzle-orm'
import { int, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { strategyVersions } from './strategy.schema'

export const strategySetupTypes = sqliteTable(
  'strategy_setup_types',
  {
    strategyVersionId: int('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    setupType: text('setup_type').notNull(),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.strategyVersionId, t.setupType] })]
)
