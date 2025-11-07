export enum TradingEventType {
  CANDLE_CLOSED = 'CANDLE_CLOSED',
  SIGNAL_FIRED = 'SIGNAL_FIRED',
  SIGNAL_INVALIDATED = 'SIGNAL_INVALIDATED',
  SETUP_CREATED = 'SETUP_CREATED',
  SETUP_UPDATED = 'SETUP_UPDATED',
  SETUP_INVALIDATED = 'SETUP_INVALIDATED',
  TRADE_TRIGGERED = 'TRADE_TRIGGERED',
  TRADE_EXECUTED = 'TRADE_EXECUTED',
  POSITION_CLOSED = 'POSITION_CLOSED',
  SAFETY_PAUSE = 'SAFETY_PAUSE',
  RESUME_REQUESTED = 'RESUME_REQUESTED',
  COOLDOWN_STARTED = 'COOLDOWN_STARTED',
  COOLDOWN_ELAPSED = 'COOLDOWN_ELAPSED',
}

export interface TradingEventMetadata {
  id: string
  timestamp: string
  source: string
}

export interface CandleClosedEvent {
  type: TradingEventType.CANDLE_CLOSED
  metadata: TradingEventMetadata
  payload: {
    instrumentId: number
    timeframe: string
    closeTime: string
  }
}

export interface SignalEvent {
  type: TradingEventType.SIGNAL_FIRED | TradingEventType.SIGNAL_INVALIDATED
  metadata: TradingEventMetadata
  payload: {
    setupId: number
    signalId: number
    signalType: string
    stillValid: boolean
  }
}

export interface SetupLifecycleEvent {
  type: TradingEventType.SETUP_CREATED | TradingEventType.SETUP_UPDATED | TradingEventType.SETUP_INVALIDATED
  metadata: TradingEventMetadata
  payload: {
    setupId: number
    state: string
    reason?: string
  }
}

export interface TradeEvent {
  type: TradingEventType.TRADE_TRIGGERED | TradingEventType.TRADE_EXECUTED | TradingEventType.POSITION_CLOSED
  metadata: TradingEventMetadata
  payload: {
    setupId: number
    positionId?: number
    status: string
    pnlPercent?: number
  }
}

export interface SafetyEvent {
  type: TradingEventType.SAFETY_PAUSE | TradingEventType.RESUME_REQUESTED
  metadata: TradingEventMetadata
  payload: {
    reason: string
  }
}

export interface CooldownEvent {
  type: TradingEventType.COOLDOWN_STARTED | TradingEventType.COOLDOWN_ELAPSED
  metadata: TradingEventMetadata
  payload: {
    until?: string
  }
}

export type TradingEvent =
  | CandleClosedEvent
  | SignalEvent
  | SetupLifecycleEvent
  | TradeEvent
  | SafetyEvent
  | CooldownEvent
