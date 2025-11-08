import { pgTable, serial, integer } from 'drizzle-orm/pg-core'
import { bots } from './bots.schema'
import { numeric } from './types.schema'

export const riskConfigs = pgTable('risk_configs', {
  id: serial('id').primaryKey(),
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
