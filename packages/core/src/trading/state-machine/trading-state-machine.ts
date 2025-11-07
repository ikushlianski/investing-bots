import { TradingEvent, TradingEventType } from '../events'

export enum TradingState {
  WATCHING = 'WATCHING',
  POSITION_OPEN = 'POSITION_OPEN',
  COOLDOWN = 'COOLDOWN',
  PAUSED = 'PAUSED',
}

export interface StateMachineConfig {
  cooldownMinutes: number
  lossesForCooldown: number
}

export const DEFAULT_STATE_MACHINE_CONFIG: StateMachineConfig = {
  cooldownMinutes: 1440,
  lossesForCooldown: 2,
}

export interface TradingStateContext {
  now: Date
  consecutiveLosses: number
  allowResume: boolean
}

export interface StateMachineTodo {
  id: string
  description: string
}

export interface StateTransitionResult {
  state: TradingState
  todos: StateMachineTodo[]
}

export class TradingStateMachine {
  private state: TradingState = TradingState.WATCHING
  private cooldownUntil: Date | null = null

  constructor(private readonly config: StateMachineConfig = DEFAULT_STATE_MACHINE_CONFIG) {}

  getState(): TradingState {
    return this.state
  }

  getCooldownUntil(): Date | null {
    return this.cooldownUntil
  }

  handleEvent(event: TradingEvent, context: TradingStateContext): StateTransitionResult {
    const todos: StateMachineTodo[] = []

    switch (event.type) {
      case TradingEventType.SAFETY_PAUSE:
        this.state = TradingState.PAUSED
        this.cooldownUntil = null

        todos.push({
          id: 'TODO_STATE_PERSISTENCE',
          description: 'Persist PAUSED state to durable storage',
        })

        break

      case TradingEventType.RESUME_REQUESTED:
        if (this.state === TradingState.PAUSED && context.allowResume) {
          this.state = TradingState.WATCHING
          this.cooldownUntil = null
        }
        break

      case TradingEventType.TRADE_EXECUTED:
        this.state = TradingState.POSITION_OPEN
        this.cooldownUntil = null
        break

      case TradingEventType.POSITION_CLOSED:
        if (context.consecutiveLosses >= this.config.lossesForCooldown) {
          this.state = TradingState.COOLDOWN
          this.cooldownUntil = new Date(context.now.getTime() + this.config.cooldownMinutes * 60 * 1000)
        } else {
          this.state = TradingState.WATCHING
          this.cooldownUntil = null
        }
        break

      case TradingEventType.COOLDOWN_ELAPSED:
        if (this.state === TradingState.COOLDOWN && this.cooldownUntil && context.now >= this.cooldownUntil) {
          this.state = TradingState.WATCHING
          this.cooldownUntil = null
        }
        break

      default:
        break
    }

    if (this.state === TradingState.COOLDOWN && !this.cooldownUntil) {
      this.cooldownUntil = new Date(context.now.getTime() + this.config.cooldownMinutes * 60 * 1000)

      todos.push({
        id: 'TODO_COOLDOWN_TIMER',
        description: 'Schedule cooldown timer to emit COOLDOWN_ELAPSED event',
      })
    }

    return {
      state: this.state,
      todos,
    }
  }
}
