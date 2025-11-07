import { describe, it, expect } from 'vitest'
import { buildOrderPlan, DEFAULT_ORDER_PLAN_CONFIG } from './order-plan'
import { SetupDirection } from '../setups/enums'

describe('buildOrderPlan', () => {
  it('should create entry and stop orders with expected offsets', () => {
    const plan = buildOrderPlan(
      {
        midPrice: 100,
        stopLoss: 95,
        takeProfitLevels: [110, 120],
        direction: SetupDirection.LONG,
        quantity: 2,
      },
      DEFAULT_ORDER_PLAN_CONFIG
    )

    expect(plan.entry.type).toBe('LIMIT')
    expect(plan.entry.price).toBeCloseTo(100 * (1 + DEFAULT_ORDER_PLAN_CONFIG.entryOffsetPercent))
    expect(plan.stop.type).toBe('STOP_LIMIT')
    expect(plan.stop.limitPrice).toBeCloseTo(95 * (1 - DEFAULT_ORDER_PLAN_CONFIG.stopLimitOffsetPercent))
    expect(plan.targets.length).toBe(2)
  })

  it('should emit todo when take profit levels missing', () => {
    const plan = buildOrderPlan(
      {
        midPrice: 100,
        stopLoss: 95,
        takeProfitLevels: [],
        direction: SetupDirection.SHORT,
        quantity: 1,
      },
      DEFAULT_ORDER_PLAN_CONFIG
    )

    expect(plan.todos.some((todo) => todo.id === 'TODO_CONFIGURE_TARGETS')).toBe(true)
  })
})
