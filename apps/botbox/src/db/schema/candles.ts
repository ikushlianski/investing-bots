import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { instruments } from './instruments'
import { numeric } from './types'

export const candles = sqliteTable('candles', {
  id: integer('id').primaryKey(),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(),
  openTime: text('open_time').notNull(),
  closeTime: text('close_time').notNull(),
  open: numeric('open', { precision: 20, scale: 8 }).notNull(),
  high: numeric('high', { precision: 20, scale: 8 }).notNull(),
  low: numeric('low', { precision: 20, scale: 8 }).notNull(),
  close: numeric('close', { precision: 20, scale: 8 }).notNull(),
  volume: numeric('volume', { precision: 30, scale: 8 }).notNull(),
  isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
  indicators: text('indicators', { mode: 'json' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})
