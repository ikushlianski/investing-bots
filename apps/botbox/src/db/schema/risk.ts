import { integer, sqliteTable, real } from 'drizzle-orm/sqlite-core'
import { bots } from './core'

export const riskConfigs = sqliteTable('risk_configs', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id')
    .notNull()
    .references(() => bots.id, { onDelete: 'cascade' }),
  maxPositionSize: real('max_position_size'),
  stopLossPercentage: real('stop_loss_percentage'),
  takeProfitPercentage: real('take_profit_percentage'),
  // Add other risk parameters as needed
})
