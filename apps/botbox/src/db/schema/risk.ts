import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { bots } from './bots'
import { numeric } from './types'

export const riskConfigs = sqliteTable('risk_configs', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  maxPositionSize: numeric('max_position_size', { precision: 20, scale: 8 }),
  stopLossPercentage: numeric('stop_loss_percentage', {
    precision: 10,
    scale: 4,
  }),
  takeProfitPercentage: numeric('take_profit_percentage', {
    precision: 10,
    scale: 4,
  }),
})
