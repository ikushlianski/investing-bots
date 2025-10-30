import { z } from 'zod'

export const ExchangeEnvironmentSchema = z.enum(['testnet', 'production'])
export type ExchangeEnvironment = z.infer<typeof ExchangeEnvironmentSchema>

export const OrderSideSchema = z.enum(['buy', 'sell'])
export type OrderSide = z.infer<typeof OrderSideSchema>

export const OrderTypeSchema = z.enum([
  'market',
  'limit',
  'stop_loss',
  'take_profit',
  'stop_loss_limit',
  'take_profit_limit',
])
export type OrderType = z.infer<typeof OrderTypeSchema>

export const TimeInForceSchema = z.enum(['GTC', 'IOC', 'FOK'])
export type TimeInForce = z.infer<typeof TimeInForceSchema>

export const OrderStatusSchema = z.enum([
  'new',
  'pending',
  'partially_filled',
  'filled',
  'cancelled',
  'rejected',
  'expired',
])
export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const PlaceOrderRequestSchema = z.object({
  symbol: z.string().min(1),
  side: OrderSideSchema,
  type: OrderTypeSchema,
  quantity: z.string().min(1),
  price: z.string().optional(),
  stopPrice: z.string().optional(),
  timeInForce: TimeInForceSchema.optional(),
  clientOrderId: z.string().optional(),
})
export type PlaceOrderRequest = z.infer<typeof PlaceOrderRequestSchema>

export const OrderResponseSchema = z.object({
  orderId: z.string(),
  clientOrderId: z.string().optional(),
  symbol: z.string(),
  side: OrderSideSchema,
  type: OrderTypeSchema,
  status: OrderStatusSchema,
  quantity: z.string(),
  executedQuantity: z.string(),
  price: z.string().optional(),
  averagePrice: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
})
export type OrderResponse = z.infer<typeof OrderResponseSchema>

export const BalanceSchema = z.object({
  asset: z.string(),
  free: z.string(),
  locked: z.string(),
  total: z.string(),
})
export type Balance = z.infer<typeof BalanceSchema>

export const GetBalanceResponseSchema = z.object({
  balances: z.array(BalanceSchema),
  timestamp: z.number(),
})
export type GetBalanceResponse = z.infer<typeof GetBalanceResponseSchema>

export const ExchangeCredentialsSchema = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  environment: ExchangeEnvironmentSchema,
})
export type ExchangeCredentials = z.infer<typeof ExchangeCredentialsSchema>
