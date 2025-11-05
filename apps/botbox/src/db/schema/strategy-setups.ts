import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { strategyVersions } from './strategy'

export const strategySetupTypes = sqliteTable(
  'strategy_setup_types',
  {
    strategyVersionId: integer('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    setupType: text('setup_type').notNull(),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey(t.strategyVersionId, t.setupType),
  })
)
