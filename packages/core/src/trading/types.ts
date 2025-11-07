import type { Timeframe as TimeframeEnum } from "./candles/enums";
import type {
  SetupType as SetupTypeEnum,
  SetupState as SetupStateEnum,
  SetupDirection as SetupDirectionEnum,
} from "./setups/enums";
import type {
  SignalType as SignalTypeEnum,
  SignalRole as SignalRoleEnum,
} from "./signals/enums";
import type { MarketRegimeType as MarketRegimeTypeEnum } from "./regimes/enums";
import type { PriceLevelType as PriceLevelTypeEnum } from "./price-levels/enums";
import type {
  TradeStatus as TradeStatusEnum,
  ExitReason as ExitReasonEnum,
} from "./positions/enums";

export type Timeframe = TimeframeEnum;
export type SetupType = SetupTypeEnum;
export type SetupState = SetupStateEnum;
export type SetupDirection = SetupDirectionEnum;
export type SignalType = SignalTypeEnum;
export type SignalRole = SignalRoleEnum;
export type MarketRegimeType = MarketRegimeTypeEnum;
export type PriceLevelType = PriceLevelTypeEnum;
export type TradeStatus = TradeStatusEnum;
export type ExitReason = ExitReasonEnum;

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTime: string;
  closeTime: string;
}

export interface Indicators {
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ema20?: number;
  ema50?: number;
  volumeMA20?: number;
}

export interface MarketData {
  price: number;
  candle: Candle;
  indicators: Indicators;
  recentCandles?: Candle[];
}

export interface SetupTTL {
  formingDurationMinutes: number;
  activeDurationMinutes: number;
  totalTTLMinutes: number;
}

export interface SetupConfig {
  symbol: string;
  entryTimeframe: Timeframe;
  contextTimeframe: Timeframe | null;
  setupType: SetupType;
  direction: SetupDirection;
  entryZoneLow: number;
  entryZoneHigh: number;
  stopLoss: number;
  takeProfit1: number | null;
  takeProfit2: number | null;
  requiredConfirmations: number;
  ttl: SetupTTL;
}
