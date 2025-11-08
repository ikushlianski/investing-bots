import { sql } from 'drizzle-orm'
import {
  pgTable,
  integer,
  text,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { strategyVersions } from './strategy.schema'

export const strategySetupTypes = pgTable(
  'strategy_setup_types',
  {
    strategyVersionId: integer('strategy_version_id')
      .notNull()
      .references(() => strategyVersions.id, { onDelete: 'cascade' }),
    setupType: text('setup_type').notNull(),
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.strategyVersionId, t.setupType] })]
)
