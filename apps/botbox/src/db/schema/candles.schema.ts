import { sql } from 'drizzle-orm'
import {
  pgTable,
  integer,
  varchar,
  timestamp,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { instruments } from './instruments.schema'
import { numeric } from './types.schema'

export const candles = pgTable(
  'candles',
  {
    instrumentId: integer('instrument_id')
      .notNull()
      .references(() => instruments.id, { onDelete: 'cascade' }),
    timeframe: varchar('timeframe', { length: 10 }).notNull(),
    timestamp: timestamp('timestamp').notNull(),
    open: numeric('open', { precision: 20, scale: 8 }).notNull(),
    high: numeric('high', { precision: 20, scale: 8 }).notNull(),
    low: numeric('low', { precision: 20, scale: 8 }).notNull(),
    close: numeric('close', { precision: 20, scale: 8 }).notNull(),
    volume: numeric('volume', { precision: 20, scale: 8 }).notNull(),
    bbUpper: numeric('bb_upper', { precision: 20, scale: 8 }),
    bbMiddle: numeric('bb_middle', { precision: 20, scale: 8 }),
    bbLower: numeric('bb_lower', { precision: 20, scale: 8 }),
    rsi: numeric('rsi', { precision: 10, scale: 2 }),
    atr: numeric('atr', { precision: 20, scale: 8 }),
    volumeMa: numeric('volume_ma', { precision: 20, scale: 8 }),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    primaryKey: primaryKey(
      table.instrumentId,
      table.timeframe,
      table.timestamp
    ),
    instrumentTimeframeTimestampIdx: index(
      'candles_instrument_timeframe_timestamp_idx'
    ).on(table.instrumentId, table.timeframe, table.timestamp.desc()),
    timestampIdx: index('candles_timestamp_idx').on(table.timestamp.desc()),
  })
)
