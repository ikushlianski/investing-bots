import { describe, it, expect } from 'vitest'
import {
  TradingStateMachine,
  TradingState,
  DEFAULT_STATE_MACHINE_CONFIG,
} from './trading-state-machine'
import { TradingEventType } from '../events'

describe('TradingStateMachine', () => {
  it('should enter paused state on safety pause event', () => {
    const machine = new TradingStateMachine(DEFAULT_STATE_MACHINE_CONFIG)

    machine.handleEvent(
      {
        type: TradingEventType.SAFETY_PAUSE,
        metadata: {
          id: 'pause-1',
          timestamp: new Date('2025-11-05T00:00:00Z').toISOString(),
          source: 'test',
        },
        payload: {
          reason: 'safety',
        },
      },
      {
        now: new Date('2025-11-05T00:00:00Z'),
        consecutiveLosses: 0,
        allowResume: false,
      }
    )

    expect(machine.getState()).toBe(TradingState.PAUSED)
  })

  it('should resume from pause when allowed', () => {
    const machine = new TradingStateMachine(DEFAULT_STATE_MACHINE_CONFIG)
    const timestamp = new Date('2025-11-05T00:00:00Z')

    machine.handleEvent(
      {
        type: TradingEventType.SAFETY_PAUSE,
        metadata: {
          id: 'pause-1',
          timestamp: timestamp.toISOString(),
          source: 'test',
        },
        payload: {
          reason: 'pause',
        },
      },
      {
        now: timestamp,
        consecutiveLosses: 0,
        allowResume: false,
      }
    )

    expect(machine.getState()).toBe(TradingState.PAUSED)

    machine.handleEvent(
      {
        type: TradingEventType.RESUME_REQUESTED,
        metadata: {
          id: 'resume-1',
          timestamp: timestamp.toISOString(),
          source: 'test',
        },
        payload: {
          reason: 'resume',
        },
      },
      {
        now: timestamp,
        consecutiveLosses: 0,
        allowResume: true,
      }
    )

    expect(machine.getState()).toBe(TradingState.WATCHING)
  })

  it('should enter cooldown after loss streak threshold', () => {
    const machine = new TradingStateMachine({
      cooldownMinutes: 60,
      lossesForCooldown: 1,
    })

    const timestamp = new Date('2025-11-05T10:00:00Z')

    machine.handleEvent(
      {
        type: TradingEventType.POSITION_CLOSED,
        metadata: {
          id: 'close-1',
          timestamp: timestamp.toISOString(),
          source: 'test',
        },
        payload: {
          setupId: 1,
          status: 'CLOSED',
        },
      },
      {
        now: timestamp,
        consecutiveLosses: 1,
        allowResume: true,
      }
    )

    expect(machine.getState()).toBe(TradingState.COOLDOWN)
    expect(machine.getCooldownUntil()).not.toBeNull()
  })
})
