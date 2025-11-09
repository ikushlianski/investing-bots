import type { PgTable } from "drizzle-orm/pg-core";
import { isNewCandleClosed, getMinutesSince } from "./candle-detection";
import { checkSignalStillValid } from "./signal-revalidation";
import { checkContextRegimeStillValid } from "./context-validation";
import { evaluateSetupState, shouldInvalidateSetup } from "./setup-lifecycle";
import type { MarketData, SignalType } from "./types";
import { Timeframe } from "./candles/enums";
import { SetupState, SetupDirection } from "./setups/enums";
import type { Timeframe as TimeframeType } from "./types";
import {
  evaluateRiskChecks,
  DEFAULT_RISK_CHECK_CONFIG,
} from "./risk/risk-checks";
import {
  buildOrderPlan,
  DEFAULT_ORDER_PLAN_CONFIG,
} from "./execution/order-plan";
import {
  TradingStateMachine,
  TradingState,
} from "./state-machine/trading-state-machine";
import { TradingEventType, type TradingEvent } from "./events";
import { MarketRegimeType } from "./regimes/enums";
import { getCurrentRegime } from "./regimes/queries";
import {
  getActiveSetupsForInvalidation,
  getActiveSetupsForEvaluation,
  invalidateSetup,
  activateSetup,
  expireOldSetups as expireOldSetupsQuery,
  countActiveSetups,
} from "./setups/queries";
import {
  getSignalsForRevalidation,
  invalidateSignal,
  updateSignalRecheckTimestamp,
  countValidSignals,
} from "./signals/queries";
import { collectRiskContext } from "./risk/queries";
import { resolveStopLoss, buildTakeProfitLevels } from "./setups/utils";
import type { DrizzleDatabase } from "./database";

export interface Database {
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  execute: (sql: string, params?: unknown[]) => Promise<void>;
  select: DrizzleDatabase["select"];
  update: DrizzleDatabase["update"];
}

export interface DatabaseTables {
  setups: PgTable;
  setupSignals: PgTable;
  marketRegimes: PgTable;
  instruments: PgTable;
  positions: PgTable;
  trades: PgTable;
}

export interface Exchange {
  getCurrentPrice: (instrumentId: number) => Promise<number>;
  fetchLatestCandle: (
    instrumentId: number,
    timeframe: TimeframeType
  ) => Promise<unknown>;
  getAccountBalance: () => Promise<number>;
  placeOrder: (order: unknown) => Promise<unknown>;
  placeStopLoss: (
    instrumentId: number,
    stopLoss: number,
    quantity: number
  ) => Promise<void>;
  placeTakeProfit: (
    instrumentId: number,
    takeProfit: number,
    quantity: number
  ) => Promise<void>;
  updateStopLoss: (instrumentId: number, newStop: number) => Promise<void>;
  closePosition: (instrumentId: number) => Promise<void>;
}

export interface TradingLoopConfig {
  enableTrading: boolean;
  maxConcurrentSetups: number;
  maxConcurrentTrades: number;
  riskPerTradePercent: number;
  pauseOnVolatilitySpike: boolean;
  volatilitySpikeMultiplier: number;
}

export const DEFAULT_LOOP_CONFIG: TradingLoopConfig = {
  enableTrading: true,
  maxConcurrentSetups: 10,
  maxConcurrentTrades: 5,
  riskPerTradePercent: 0.01,
  pauseOnVolatilitySpike: true,
  volatilitySpikeMultiplier: 2.0,
};

const tradingStateMachine = new TradingStateMachine();

export async function runTradingLoop(
  db: Database,
  tables: DatabaseTables,
  exchange: Exchange,
  config: TradingLoopConfig = DEFAULT_LOOP_CONFIG
): Promise<void> {
  const currentTime = new Date();

  if (isNewCandleClosed(Timeframe.ONE_HOUR, currentTime)) {
    await processNewCandle(db, exchange, Timeframe.ONE_HOUR, currentTime);
  }

  if (isNewCandleClosed(Timeframe.FOUR_HOURS, currentTime)) {
    await processNewCandle(db, exchange, Timeframe.FOUR_HOURS, currentTime);
  }

  if (isNewCandleClosed(Timeframe.ONE_DAY, currentTime)) {
    await processNewCandle(db, exchange, Timeframe.ONE_DAY, currentTime);
  }

  await updateRegimesIfNeeded(db);

  if (await shouldPauseTrading(db, config)) {
    console.log("[TRADING LOOP] Trading paused due to safety check");

    const pauseEvent: TradingEvent = {
      type: TradingEventType.SAFETY_PAUSE,
      metadata: {
        id: `pause-${currentTime.getTime()}`,
        timestamp: currentTime.toISOString(),
        source: "trading-loop",
      },
      payload: {
        reason: "Safety check triggered",
      },
    };

    const pauseResult = tradingStateMachine.handleEvent(pauseEvent, {
      now: currentTime,
      consecutiveLosses: 0,
      allowResume: false,
    });

    logTodos(pauseResult.todos);

    return;
  }

  if (tradingStateMachine.getState() === TradingState.PAUSED) {
    const resumeEvent: TradingEvent = {
      type: TradingEventType.RESUME_REQUESTED,
      metadata: {
        id: `resume-${currentTime.getTime()}`,
        timestamp: currentTime.toISOString(),
        source: "trading-loop",
      },
      payload: {
        reason: "Safety check cleared",
      },
    };

    const resumeResult = tradingStateMachine.handleEvent(resumeEvent, {
      now: currentTime,
      consecutiveLosses: 0,
      allowResume: true,
    });

    logTodos(resumeResult.todos);
  }

  if (tradingStateMachine.getState() === TradingState.PAUSED) {
    return;
  }

  await expireOldSetups(db, tables, currentTime);
  await checkSetupInvalidations(db, tables, exchange);
  await revalidateSignals(db, tables, exchange);
  await evaluateActiveSetups(db, tables, exchange, config);

  if (await canCreateNewSetups(db, tables, config)) {
    await scanForNewSetups(db, exchange);
  }

  await manageOpenPositions(db, exchange);
}

async function processNewCandle(
  db: Database,
  exchange: Exchange,
  timeframe: TimeframeType,
  currentTime: Date
): Promise<void> {
  console.log(
    `[TRADING LOOP] New ${timeframe} candle closed at ${currentTime.toISOString()}`
  );

  const instruments = await getActiveInstruments(db);

  for (const instrument of instruments) {
    const candle = await exchange.fetchLatestCandle(instrument.id, timeframe);

    await storeCandle(db, instrument.id, timeframe, candle);
    await updateIndicators(db, instrument.id, timeframe);
    await updatePriceLevels(db, instrument.id, timeframe);
    await updateMarketRegime(db, instrument.id, timeframe);
    await checkAndFireSignals(db, instrument.id, timeframe);
    await incrementSetupCandleCounts(db, instrument.id, timeframe, currentTime);
  }
}

function getActiveInstruments(
  _db: Database
): Promise<{ id: number; symbol: string }[]> {
  return Promise.resolve([]);
}

async function storeCandle(
  _db: Database,
  _instrumentId: number,
  _timeframe: TimeframeType,
  _candle: unknown
): Promise<void> {}

async function updateIndicators(
  _db: Database,
  _instrumentId: number,
  _timeframe: TimeframeType
): Promise<void> {}

async function updatePriceLevels(
  _db: Database,
  _instrumentId: number,
  _timeframe: TimeframeType
): Promise<void> {}

async function updateMarketRegime(
  _db: Database,
  _instrumentId: number,
  _timeframe: TimeframeType
): Promise<void> {}

async function checkAndFireSignals(
  _db: Database,
  _instrumentId: number,
  _timeframe: TimeframeType
): Promise<void> {}

async function incrementSetupCandleCounts(
  _db: Database,
  _instrumentId: number,
  _timeframe: TimeframeType,
  _currentTime: Date
): Promise<void> {}

async function updateRegimesIfNeeded(_db: Database): Promise<void> {}

async function shouldPauseTrading(
  db: Database,
  config: TradingLoopConfig
): Promise<boolean> {
  if (!config.enableTrading) {
    return true;
  }

  if (config.pauseOnVolatilitySpike) {
    const currentVolatility = await getCurrentVolatility(db);
    const normalVolatility = await getNormalVolatility(db);

    if (
      currentVolatility >
      normalVolatility * config.volatilitySpikeMultiplier
    ) {
      console.log(
        `[SAFETY] Pausing trading due to volatility spike: ${(
          currentVolatility / normalVolatility
        ).toFixed(2)}x normal`
      );

      return true;
    }
  }

  return false;
}

function getCurrentVolatility(_db: Database): Promise<number> {
  return Promise.resolve(0.1);
}

function getNormalVolatility(_db: Database): Promise<number> {
  return Promise.resolve(0.1);
}

async function expireOldSetups(
  db: Database,
  tables: DatabaseTables,
  currentTime: Date
): Promise<void> {
  await expireOldSetupsQuery(db, tables.setups, currentTime);
}

async function checkSetupInvalidations(
  db: Database,
  tables: DatabaseTables,
  exchange: Exchange
): Promise<void> {
  const activeSetups = await getActiveSetupsForInvalidation(db, tables.setups);

  for (const setup of activeSetups) {
    const currentPrice = await exchange.getCurrentPrice(setup.instrumentId);

    const invalidation = shouldInvalidateSetup(
      currentPrice,
      setup.entryZoneLow,
      setup.entryZoneHigh,
      setup.direction,
      setup.activatedAt ? getMinutesSince(setup.activatedAt) : 0
    );

    if (invalidation.shouldInvalidate) {
      await invalidateSetup(db, tables.setups, setup.id, invalidation.reason!);
      continue;
    }

    if (setup.contextRegimeId && setup.contextTimeframe) {
      const currentContextRegime = await getCurrentRegime(
        db,
        tables.marketRegimes,
        setup.instrumentId,
        setup.contextTimeframe as Timeframe
      );

      if (currentContextRegime) {
        const contextCheck = checkContextRegimeStillValid(
          setup.contextRegimeId,
          currentContextRegime
        );

        if (!contextCheck.valid) {
          await invalidateSetup(
            db,
            tables.setups,
            setup.id,
            "CONTEXT_REGIME_CHANGED"
          );
        }
      }
    }
  }
}

async function revalidateSignals(
  db: Database,
  tables: DatabaseTables,
  exchange: Exchange
): Promise<void> {
  const signalsToRecheck = await getSignalsForRevalidation(
    db,
    tables.setupSignals,
    tables.setups
  );

  for (const signal of signalsToRecheck) {
    const marketData = await getMarketData(
      db,
      exchange,
      signal.instrumentId,
      signal.detectedOnTimeframe as Timeframe
    );
    const revalidation = checkSignalStillValid(
      signal.signalType as SignalType,
      signal.firedAt,
      signal.value ? parseFloat(signal.value) : null,
      marketData
    );

    if (!revalidation.isValid) {
      await invalidateSignal(db, tables.setupSignals, signal.id);
      console.log(
        `[SIGNAL] Invalidated signal ${signal.id}: ${revalidation.reason}`
      );
    }

    await updateSignalRecheckTimestamp(db, tables.setupSignals, signal.id);
  }
}

async function getMarketData(
  _db: Database,
  exchange: Exchange,
  instrumentId: number,
  _timeframe: Timeframe
): Promise<MarketData> {
  const price = await exchange.getCurrentPrice(instrumentId);

  return {
    price,
    candle: {
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
      openTime: new Date().toISOString(),
      closeTime: new Date().toISOString(),
    },
    indicators: {},
  };
}

async function evaluateActiveSetups(
  db: Database,
  tables: DatabaseTables,
  exchange: Exchange,
  config: TradingLoopConfig
): Promise<void> {
  const activeSetups = await getActiveSetupsForEvaluation(db, tables.setups);

  for (const setup of activeSetups) {
    const currentPrice = await exchange.getCurrentPrice(setup.instrumentId);
    const validSignals = await countValidSignals(
      db,
      tables.setupSignals,
      setup.id
    );
    const minutesSinceCreation = getMinutesSince(setup.createdAt);

    const newState = evaluateSetupState(
      setup.state as SetupState,
      currentPrice,
      setup.entryZoneLow,
      setup.entryZoneHigh,
      setup.requiredConfirmations,
      validSignals,
      minutesSinceCreation,
      setup.formingDurationMinutes
    );

    if (newState === SetupState.ACTIVE && setup.state === SetupState.FORMING) {
      await activateSetup(db, tables.setups, setup.id);
      console.log(`[SETUP] Setup ${setup.id} activated`);
    }

    if (
      newState === SetupState.TRIGGERED &&
      setup.state === SetupState.ACTIVE
    ) {
      await triggerTrade(db, tables, exchange, setup, config);
    }
  }
}

async function triggerTrade(
  db: Database,
  tables: DatabaseTables,
  exchange: Exchange,
  setup: {
    id: number;
    instrumentId: number;
    direction: "LONG" | "SHORT";
    entryZoneLow: number;
    entryZoneHigh: number;
    stopLoss: number | null;
    takeProfit1: number | null;
    takeProfit2: number | null;
    entryTimeframe: string;
    contextTimeframe: string | null;
  },
  config: TradingLoopConfig
): Promise<void> {
  const direction =
    setup.direction === "LONG" ? SetupDirection.LONG : SetupDirection.SHORT;
  const entryTimeframe =
    (setup.entryTimeframe as Timeframe) ?? Timeframe.ONE_HOUR;
  const midPrice = (setup.entryZoneLow + setup.entryZoneHigh) / 2;
  const localTodos: { id: string; description: string }[] = [];
  const currentState = tradingStateMachine.getState();

  if (
    currentState === TradingState.PAUSED ||
    currentState === TradingState.COOLDOWN
  ) {
    console.log(
      `[TRADE] Skipping setup ${setup.id} due to state ${currentState}`
    );

    return;
  }

  const stopResolution = resolveStopLoss(setup, direction, midPrice);
  const stopLoss = stopResolution.value;

  if (stopResolution.fallbackUsed) {
    localTodos.push({
      id: "TODO_SETUP_STOP",
      description:
        "Persist stop loss before promoting setup to triggerable state",
    });
  }

  const takeProfitResolution = buildTakeProfitLevels(
    setup,
    direction,
    midPrice
  );
  const takeProfitLevels = takeProfitResolution.levels;

  localTodos.push(...takeProfitResolution.todos);
  const stopDistancePercent =
    midPrice === 0 ? 0 : Math.abs(midPrice - stopLoss) / midPrice;
  const requestedPositionSizePercent =
    stopDistancePercent === 0
      ? 0
      : config.riskPerTradePercent / stopDistancePercent;

  const accountBalance = await exchange.getAccountBalance();
  const riskContext = await collectRiskContext(
    db,
    tables.positions
  );
  const regimeRecord =
    setup.contextTimeframe !== null
      ? await getCurrentRegime(
          db,
          tables.marketRegimes,
          setup.instrumentId,
          setup.contextTimeframe as Timeframe
        )
      : null;

  const riskResult = evaluateRiskChecks(
    {
      accountBalance,
      requestedRiskPercent: config.riskPerTradePercent,
      requestedPositionSizePercent,
      entryPrice: midPrice,
      stopPrice: stopLoss,
      timeframe: entryTimeframe,
      direction,
      regime: regimeRecord?.regimeType ?? MarketRegimeType.NEUTRAL,
      dailyLossPercent: riskContext.dailyLossPercent,
      openPositions: riskContext.openPositions,
      correlatedExposureCount: riskContext.correlatedExposureCount,
      openRiskPercent: riskContext.openRiskPercent,
    },
    DEFAULT_RISK_CHECK_CONFIG
  );

  if (!riskResult.isAllowed) {
    riskResult.failures.forEach((failure) => {
      console.log(`[RISK] ${failure.checkId}: ${failure.reason}`);
    });

    logTodos([...localTodos, ...riskContext.todos, ...riskResult.todos]);

    return;
  }

  const orderPlan = buildOrderPlan(
    {
      midPrice,
      stopLoss,
      takeProfitLevels,
      direction,
      quantity: riskResult.positionSizeUnits,
    },
    DEFAULT_ORDER_PLAN_CONFIG
  );

  const triggerEvent: TradingEvent = {
    type: TradingEventType.TRADE_TRIGGERED,
    metadata: {
      id: `trigger-${setup.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "trading-loop",
    },
    payload: {
      setupId: setup.id,
      status: "TRIGGERED",
    },
  };

  const stateResult = tradingStateMachine.handleEvent(triggerEvent, {
    now: new Date(),
    consecutiveLosses: 0,
    allowResume: true,
  });

  console.log(
    `[TRADE] Prepared order plan for setup ${
      setup.id
    } entry=${orderPlan.entry.price.toFixed(
      5
    )} stop=${orderPlan.stop.price.toFixed(
      5
    )} quantity=${orderPlan.entry.quantity.toFixed(4)}`
  );

  orderPlan.targets.forEach((target, index) => {
    console.log(
      `[TRADE] target${index + 1} price=${target.price.toFixed(
        5
      )} quantity=${target.quantity.toFixed(4)}`
    );
  });

  logTodos([
    ...localTodos,
    ...riskContext.todos,
    ...riskResult.todos,
    ...orderPlan.todos,
    ...stateResult.todos,
  ]);
}

function logTodos(todos: { id: string; description: string }[]): void {
  const seen = new Set<string>();

  todos.forEach((todo) => {
    if (seen.has(todo.id)) {
      return;
    }

    seen.add(todo.id);
    console.log(`[TODO] ${todo.id}: ${todo.description}`);
  });
}

async function canCreateNewSetups(
  db: Database,
  tables: DatabaseTables,
  config: TradingLoopConfig
): Promise<boolean> {
  const count = await countActiveSetups(db, tables.setups);

  return count < config.maxConcurrentSetups;
}

async function scanForNewSetups(
  _db: Database,
  _exchange: Exchange
): Promise<void> {}

async function manageOpenPositions(
  _db: Database,
  _exchange: Exchange
): Promise<void> {}
