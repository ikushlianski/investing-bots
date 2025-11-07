import { SetupDirection } from './enums'

export interface StopLossResolution {
  value: number
  fallbackUsed: boolean
}

export interface TakeProfitResolution {
  levels: number[]
  todos: { id: string; description: string }[]
}

export function resolveStopLoss(
  setup: {
    stopLoss: number | null
    entryZoneLow: number
    entryZoneHigh: number
    direction: 'LONG' | 'SHORT'
  },
  direction: SetupDirection,
  midPrice: number
): StopLossResolution {
  if (setup.stopLoss !== null) {
    return {
      value: setup.stopLoss,
      fallbackUsed: false,
    }
  }

  const defaultStopDistancePercent = 0.02
  const stopDistance = midPrice * defaultStopDistancePercent

  if (direction === SetupDirection.SHORT) {
    return {
      value: midPrice + stopDistance,
      fallbackUsed: true,
    }
  }

  return {
    value: midPrice - stopDistance,
    fallbackUsed: true,
  }
}

export function buildTakeProfitLevels(
  setup: {
    takeProfit1: number | null
    takeProfit2: number | null
  },
  direction: SetupDirection,
  midPrice: number
): TakeProfitResolution {
  const todos: { id: string; description: string }[] = []
  const levels: number[] = []

  if (setup.takeProfit1 !== null) {
    levels.push(setup.takeProfit1)
  } else {
    todos.push({
      id: 'TODO_SETUP_TAKE_PROFIT_1',
      description: 'Persist take profit 1 before promoting setup to triggerable state',
    })
  }

  if (setup.takeProfit2 !== null) {
    levels.push(setup.takeProfit2)
  } else {
    todos.push({
      id: 'TODO_SETUP_TAKE_PROFIT_2',
      description: 'Persist take profit 2 before promoting setup to triggerable state',
    })
  }

  if (levels.length === 0) {
    const defaultTpDistancePercent = 0.03
    const tpDistance = midPrice * defaultTpDistancePercent

    if (direction === SetupDirection.SHORT) {
      levels.push(midPrice - tpDistance)
    } else {
      levels.push(midPrice + tpDistance)
    }

    todos.push({
      id: 'TODO_SETUP_TAKE_PROFIT_DEFAULT',
      description: 'Use default take profit levels - consider calculating from setup type',
    })
  }

  return {
    levels,
    todos,
  }
}

