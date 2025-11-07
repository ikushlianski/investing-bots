import { SetupDirection } from '../setups/enums'

export interface OrderPlanConfig {
  entryOffsetPercent: number
  stopLimitOffsetPercent: number
  takeProfitPercents: number[]
  breakevenThresholdPercent: number
  trailingStopThresholdPercent: number
  trailingStopDistancePercent: number
}

export const DEFAULT_ORDER_PLAN_CONFIG: OrderPlanConfig = {
  entryOffsetPercent: 0.0002,
  stopLimitOffsetPercent: 0.003,
  takeProfitPercents: [0.5, 0.25, 0.25],
  breakevenThresholdPercent: 0.03,
  trailingStopThresholdPercent: 0.05,
  trailingStopDistancePercent: 0.02,
}

export interface OrderPlanInput {
  midPrice: number
  stopLoss: number
  takeProfitLevels: number[]
  direction: SetupDirection
  quantity: number
}

export interface PlannedOrder {
  price: number
  quantity: number
  type: 'LIMIT' | 'STOP_LIMIT'
  side: 'BUY' | 'SELL'
  stopPrice?: number
  limitPrice?: number
}

export interface OrderPlan {
  entry: PlannedOrder
  stop: PlannedOrder
  targets: PlannedOrder[]
  todos: { id: string; description: string }[]
}

export function buildOrderPlan(
  input: OrderPlanInput,
  config: OrderPlanConfig = DEFAULT_ORDER_PLAN_CONFIG
): OrderPlan {
  const entrySide = input.direction === SetupDirection.SHORT ? 'SELL' : 'BUY'
  const stopSide = input.direction === SetupDirection.SHORT ? 'BUY' : 'SELL'

  const entryPrice =
    input.direction === SetupDirection.SHORT
      ? input.midPrice * (1 - config.entryOffsetPercent)
      : input.midPrice * (1 + config.entryOffsetPercent)

  const stopLimitPrice =
    input.direction === SetupDirection.SHORT
      ? input.stopLoss * (1 + config.stopLimitOffsetPercent)
      : input.stopLoss * (1 - config.stopLimitOffsetPercent)

  const entry: PlannedOrder = {
    price: entryPrice,
    quantity: input.quantity,
    type: 'LIMIT',
    side: entrySide,
  }

  const stop: PlannedOrder = {
    price: input.stopLoss,
    quantity: input.quantity,
    type: 'STOP_LIMIT',
    side: stopSide,
    stopPrice: input.stopLoss,
    limitPrice: stopLimitPrice,
  }

  const targets = buildTargets(input, config, stopSide)
  const todos = buildTodos(targets)

  return {
    entry,
    stop,
    targets,
    todos,
  }
}

function buildTargets(
  input: OrderPlanInput,
  config: OrderPlanConfig,
  stopSide: 'BUY' | 'SELL'
): PlannedOrder[] {
  const allocations = normalizeAllocations(config.takeProfitPercents)

  return input.takeProfitLevels.slice(0, allocations.length).map((price, index) => ({
    price,
    quantity: input.quantity * allocations[index],
    type: 'LIMIT',
    side: stopSide,
  }))
}

function normalizeAllocations(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0)

  if (total === 0) {
    return values.map(() => 0)
  }

  return values.map((value) => value / total)
}

function buildTodos(targets: PlannedOrder[]): { id: string; description: string }[] {
  if (targets.length === 0) {
    return [
      {
        id: 'TODO_CONFIGURE_TARGETS',
        description: 'Define takeProfitLevels before scheduling orders',
      },
    ]
  }

  return [
    {
      id: 'TODO_ORDER_ROUTING',
      description: 'Connect order plan to exchange routing adapter',
    },
  ]
}
