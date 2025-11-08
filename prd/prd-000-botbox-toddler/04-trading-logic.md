# Phase 4: Trading Logic - ST-002 Mean Reversion

## Overview

Implement market regime detection, setup scanning, and risk management for Bollinger Band mean reversion strategy.

**Estimated Time**: 6-8 hours (Week 2, Days 1-4)

## Trading Mode: Logging vs Real Execution

The system supports two trading modes:

- **LOGGING Mode (Default)**: Paper trading mode that simulates trades without placing real orders. All trades are logged to the database with `tradeType='MOCK'`. This allows you to:

  - Test trading logic safely
  - Gather statistics on mock trades
  - See what the bot would do without risking capital
  - Compare mock vs real trade performance

- **REAL Mode**: Executes actual orders on the exchange (testnet or mainnet). All trades are logged with `tradeType='REAL'`. Use this when you're ready to execute real trades.

**Configuration**: Set `TRADING_MODE=LOGGING` (default) or `TRADING_MODE=REAL` in `.dev.vars` or environment variables.

**Trade Tracking**: Both modes log trades to the same database tables, but differentiate using the `tradeType` field. Statistics can be filtered by trade type to compare paper trading vs real trading performance.

---

## Task 4.1: Create Market Regime Detector (ATR-based) (20 mins)

### Description

Implement ranging vs trending market detection using ATR as proxy for ADX.

### Steps

1. Create `apps/botbox/src/trading/regime-detector.ts`:

   ```typescript
   import { candles } from "../db/schema";
   import { createDbConnection } from "../db/connection";
   import { eq, and, desc } from "drizzle-orm";

   export enum MarketRegime {
     RANGING = "RANGING",
     TRENDING = "TRENDING",
     UNKNOWN = "UNKNOWN",
   }

   export interface RegimeDetectionResult {
     regime: MarketRegime;
     atrCurrent: number;
     atrAverage: number;
     atrRatio: number;
     confidence: number;
   }

   export class RegimeDetector {
     constructor(private db: ReturnType<typeof createDbConnection>) {}

     async detectRegime(
       instrumentId: number,
       timeframe: string = "240"
     ): Promise<RegimeDetectionResult> {
       const recentCandles = await this.db
         .select()
         .from(candles)
         .where(
           and(
             eq(candles.instrumentId, instrumentId),
             eq(candles.timeframe, timeframe)
           )
         )
         .orderBy(desc(candles.timestamp))
         .limit(50);

       if (recentCandles.length < 50) {
         return {
           regime: MarketRegime.UNKNOWN,
           atrCurrent: 0,
           atrAverage: 0,
           atrRatio: 0,
           confidence: 0,
         };
       }

       const atrs = recentCandles
         .map((c) => (c.atr ? parseFloat(c.atr) : null))
         .filter((atr): atr is number => atr !== null);

       if (atrs.length < 20) {
         return {
           regime: MarketRegime.UNKNOWN,
           atrCurrent: 0,
           atrAverage: 0,
           atrRatio: 0,
           confidence: 0,
         };
       }

       const atrCurrent = atrs[0];
       const atrAverage = atrs.reduce((sum, atr) => sum + atr, 0) / atrs.length;
       const atrRatio = atrCurrent / atrAverage;

       let regime: MarketRegime;
       let confidence: number;

       if (atrRatio < 0.7) {
         regime = MarketRegime.RANGING;
         confidence = Math.min((0.7 - atrRatio) / 0.3, 1);
       } else if (atrRatio > 1.3) {
         regime = MarketRegime.TRENDING;
         confidence = Math.min((atrRatio - 1.3) / 0.7, 1);
       } else {
         regime = MarketRegime.RANGING;
         confidence = 0.5;
       }

       return {
         regime,
         atrCurrent,
         atrAverage,
         atrRatio,
         confidence,
       };
     }
   }
   ```

### Expected Output

- Regime detector service created
- Returns RANGING when ATR < 0.7× average
- Returns TRENDING when ATR > 1.3× average

### Files Created/Modified

- `apps/botbox/src/trading/regime-detector.ts` (create)

---

## Task 4.2: Create Setup Scanner - Lower BB Bounce (25 mins)

### Description

Implement detection logic for Lower Bollinger Band bounce setup (long entries).

### Steps

1. Create `apps/botbox/src/trading/setup-scanner.ts`:

   ```typescript
   import { createDbConnection } from "../db/connection";
   import { candles, instruments, setups, setupSignals } from "../db/schema";
   import { eq, and, desc } from "drizzle-orm";
   import { RegimeDetector, MarketRegime } from "./regime-detector";

   export enum SetupType {
     LOWER_BB_BOUNCE = "LOWER_BB_BOUNCE",
     UPPER_BB_REJECTION = "UPPER_BB_REJECTION",
   }

   export enum SignalType {
     PRICE_AT_LOWER_BB = "PRICE_AT_LOWER_BB",
     PRICE_AT_UPPER_BB = "PRICE_AT_UPPER_BB",
     RSI_OVERSOLD = "RSI_OVERSOLD",
     RSI_OVERBOUGHT = "RSI_OVERBOUGHT",
     VOLUME_CONFIRMATION = "VOLUME_CONFIRMATION",
     RANGING_MARKET = "RANGING_MARKET",
   }

   export interface SetupDetectionResult {
     instrumentId: number;
     symbol: string;
     setupType: SetupType;
     entryPrice: number;
     stopLoss: number;
     takeProfit1: number;
     takeProfit2: number;
     signals: Array<{
       type: SignalType;
       value: string;
     }>;
     metadata: Record<string, any>;
   }

   export class SetupScanner {
     constructor(
       private db: ReturnType<typeof createDbConnection>,
       private regimeDetector: RegimeDetector
     ) {}

     async scanForSetups(
       timeframe: string = "60"
     ): Promise<SetupDetectionResult[]> {
       const allInstruments = await this.db
         .select()
         .from(instruments)
         .where(eq(instruments.isActive, true));

       const detectedSetups: SetupDetectionResult[] = [];

       for (const instrument of allInstruments) {
         const regime = await this.regimeDetector.detectRegime(
           instrument.id,
           "240"
         );

         if (regime.regime !== MarketRegime.RANGING) {
           console.log(
             `  [${instrument.symbol}] Skipping - market is ${regime.regime}`
           );
           continue;
         }

         const latestCandle = await this.db
           .select()
           .from(candles)
           .where(
             and(
               eq(candles.instrumentId, instrument.id),
               eq(candles.timeframe, timeframe)
             )
           )
           .orderBy(desc(candles.timestamp))
           .limit(1);

         if (latestCandle.length === 0) continue;

         const candle = latestCandle[0];

         if (
           !candle.bbLower ||
           !candle.bbUpper ||
           !candle.rsi ||
           !candle.volumeMa
         ) {
           continue;
         }

         const close = parseFloat(candle.close);
         const low = parseFloat(candle.low);
         const bbLower = parseFloat(candle.bbLower);
         const bbMiddle = parseFloat(candle.bbMiddle!);
         const bbUpper = parseFloat(candle.bbUpper);
         const rsi = parseFloat(candle.rsi);
         const volume = parseFloat(candle.volume);
         const volumeMa = parseFloat(candle.volumeMa);

         const lowerBounceSetup = this.checkLowerBBBounce({
           instrument,
           candle,
           close,
           low,
           bbLower,
           bbMiddle,
           bbUpper,
           rsi,
           volume,
           volumeMa,
           regime,
         });

         if (lowerBounceSetup) {
           detectedSetups.push(lowerBounceSetup);
         }

         const upperRejectionSetup = this.checkUpperBBRejection({
           instrument,
           candle,
           close,
           high: parseFloat(candle.high),
           bbLower,
           bbMiddle,
           bbUpper,
           rsi,
           volume,
           volumeMa,
           regime,
         });

         if (upperRejectionSetup) {
           detectedSetups.push(upperRejectionSetup);
         }
       }

       return detectedSetups;
     }

     private checkLowerBBBounce(params: {
       instrument: any;
       candle: any;
       close: number;
       low: number;
       bbLower: number;
       bbMiddle: number;
       bbUpper: number;
       rsi: number;
       volume: number;
       volumeMa: number;
       regime: any;
     }): SetupDetectionResult | null {
       const signals: Array<{ type: SignalType; value: string }> = [];

       const touchedBB =
         params.low <= params.bbLower && params.close > params.bbLower * 0.998;
       if (touchedBB) {
         signals.push({
           type: SignalType.PRICE_AT_LOWER_BB,
           value: `Low ${params.low.toFixed(
             2
           )} touched BB ${params.bbLower.toFixed(2)}`,
         });
       }

       const rsiOversold = params.rsi < 35;
       if (rsiOversold) {
         signals.push({
           type: SignalType.RSI_OVERSOLD,
           value: `RSI ${params.rsi.toFixed(1)} < 35`,
         });
       }

       const volumeConfirmation = params.volume > params.volumeMa * 1.1;
       if (volumeConfirmation) {
         signals.push({
           type: SignalType.VOLUME_CONFIRMATION,
           value: `Volume ${params.volume.toFixed(0)} > ${(
             params.volumeMa * 1.1
           ).toFixed(0)}`,
         });
       }

       signals.push({
         type: SignalType.RANGING_MARKET,
         value: `ATR ratio ${params.regime.atrRatio.toFixed(2)} (${
           params.regime.regime
         })`,
       });

       if (signals.length >= 4) {
         const atr = parseFloat(params.candle.atr || "0");
         const stopLoss = params.bbLower - 1.5 * atr;
         const takeProfit1 = params.bbMiddle;
         const takeProfit2 = params.bbUpper;

         return {
           instrumentId: params.instrument.id,
           symbol: params.instrument.symbol,
           setupType: SetupType.LOWER_BB_BOUNCE,
           entryPrice: params.close,
           stopLoss,
           takeProfit1,
           takeProfit2,
           signals,
           metadata: {
             timestamp: params.candle.timestamp,
             timeframe: params.candle.timeframe,
             bbLower: params.bbLower,
             bbMiddle: params.bbMiddle,
             bbUpper: params.bbUpper,
             rsi: params.rsi,
             atr: atr,
             regimeConfidence: params.regime.confidence,
           },
         };
       }

       return null;
     }

     private checkUpperBBRejection(params: {
       instrument: any;
       candle: any;
       close: number;
       high: number;
       bbLower: number;
       bbMiddle: number;
       bbUpper: number;
       rsi: number;
       volume: number;
       volumeMa: number;
       regime: any;
     }): SetupDetectionResult | null {
       const signals: Array<{ type: SignalType; value: string }> = [];

       const touchedBB =
         params.high >= params.bbUpper && params.close < params.bbUpper * 1.002;
       if (touchedBB) {
         signals.push({
           type: SignalType.PRICE_AT_UPPER_BB,
           value: `High ${params.high.toFixed(
             2
           )} touched BB ${params.bbUpper.toFixed(2)}`,
         });
       }

       const rsiOverbought = params.rsi > 65;
       if (rsiOverbought) {
         signals.push({
           type: SignalType.RSI_OVERBOUGHT,
           value: `RSI ${params.rsi.toFixed(1)} > 65`,
         });
       }

       const volumeConfirmation = params.volume > params.volumeMa * 1.1;
       if (volumeConfirmation) {
         signals.push({
           type: SignalType.VOLUME_CONFIRMATION,
           value: `Volume ${params.volume.toFixed(0)} > ${(
             params.volumeMa * 1.1
           ).toFixed(0)}`,
         });
       }

       signals.push({
         type: SignalType.RANGING_MARKET,
         value: `ATR ratio ${params.regime.atrRatio.toFixed(2)} (${
           params.regime.regime
         })`,
       });

       if (signals.length >= 4) {
         const atr = parseFloat(params.candle.atr || "0");
         const stopLoss = params.bbUpper + 1.5 * atr;
         const takeProfit1 = params.bbMiddle;
         const takeProfit2 = params.bbLower;

         return {
           instrumentId: params.instrument.id,
           symbol: params.instrument.symbol,
           setupType: SetupType.UPPER_BB_REJECTION,
           entryPrice: params.close,
           stopLoss,
           takeProfit1,
           takeProfit2,
           signals,
           metadata: {
             timestamp: params.candle.timestamp,
             timeframe: params.candle.timeframe,
             bbLower: params.bbLower,
             bbMiddle: params.bbMiddle,
             bbUpper: params.bbUpper,
             rsi: params.rsi,
             atr: atr,
             regimeConfidence: params.regime.confidence,
           },
         };
       }

       return null;
     }
   }
   ```

### Expected Output

- Setup scanner service created
- Detects both lower BB bounce and upper BB rejection
- Requires 4 signals to create setup

### Files Created/Modified

- `apps/botbox/src/trading/setup-scanner.ts` (create)

---

## Task 4.3: Create Setups Database Schema (15 mins)

### Description

Add missing setups and setup_signals tables to database.

### Steps

1. Create `apps/botbox/src/db/schema/setups-v0.schema.ts`:

   ```typescript
   import {
     pgTable,
     serial,
     integer,
     varchar,
     timestamp,
     text,
     numeric,
   } from "drizzle-orm/pg-core";
   import { instruments } from "./instruments.schema";

   export const setupsV0 = pgTable("setups_v0", {
     id: serial("id").primaryKey(),
     instrumentId: integer("instrument_id")
       .notNull()
       .references(() => instruments.id),
     setupType: varchar("setup_type", { length: 50 }).notNull(),
     status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
     entryPrice: numeric("entry_price", { precision: 20, scale: 8 }).notNull(),
     stopLoss: numeric("stop_loss", { precision: 20, scale: 8 }).notNull(),
     takeProfit1: numeric("take_profit_1", {
       precision: 20,
       scale: 8,
     }).notNull(),
     takeProfit2: numeric("take_profit_2", {
       precision: 20,
       scale: 8,
     }).notNull(),
     timeframe: varchar("timeframe", { length: 10 }).notNull(),
     metadata: text("metadata"),
     detectedAt: timestamp("detected_at").notNull().defaultNow(),
     approvedAt: timestamp("approved_at"),
     invalidatedAt: timestamp("invalidated_at"),
     invalidationReason: text("invalidation_reason"),
   });

   export const setupSignalsV0 = pgTable("setup_signals_v0", {
     id: serial("id").primaryKey(),
     setupId: integer("setup_id")
       .notNull()
       .references(() => setupsV0.id),
     signalType: varchar("signal_type", { length: 50 }).notNull(),
     value: text("value").notNull(),
     createdAt: timestamp("created_at").notNull().defaultNow(),
   });
   ```

2. Export from schema index

3. Generate and run migration:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Expected Output

- Setup tables created
- Ready to store detected setups

### Files Created/Modified

- `apps/botbox/src/db/schema/setups-v0.schema.ts` (create)
- `apps/botbox/src/db/schema/index.ts` (modify)

---

## Task 4.4: Create Setup Persistence Repository (20 mins)

### Description

Build database functions to save detected setups and their signals.

### Steps

1. Create `apps/botbox/src/db/setups-repository.ts`:

   ```typescript
   import { createDbConnection } from "./connection";
   import { setupsV0, setupSignalsV0 } from "./schema";
   import { SetupDetectionResult } from "../trading/setup-scanner";
   import { eq } from "drizzle-orm";

   export class SetupsRepository {
     constructor(private db: ReturnType<typeof createDbConnection>) {}

     async createSetup(setup: SetupDetectionResult): Promise<number> {
       const [inserted] = await this.db
         .insert(setupsV0)
         .values({
           instrumentId: setup.instrumentId,
           setupType: setup.setupType,
           status: "ACTIVE",
           entryPrice: setup.entryPrice.toString(),
           stopLoss: setup.stopLoss.toString(),
           takeProfit1: setup.takeProfit1.toString(),
           takeProfit2: setup.takeProfit2.toString(),
           timeframe: setup.metadata.timeframe,
           metadata: JSON.stringify(setup.metadata),
         })
         .returning({ id: setupsV0.id });

       for (const signal of setup.signals) {
         await this.db.insert(setupSignalsV0).values({
           setupId: inserted.id,
           signalType: signal.type,
           value: signal.value,
         });
       }

       return inserted.id;
     }

     async getActiveSetups() {
       return this.db
         .select()
         .from(setupsV0)
         .where(eq(setupsV0.status, "ACTIVE"));
     }

     async approveSetup(setupId: number) {
       await this.db
         .update(setupsV0)
         .set({
           status: "APPROVED",
           approvedAt: new Date(),
         })
         .where(eq(setupsV0.id, setupId));
     }

     async invalidateSetup(setupId: number, reason: string) {
       await this.db
         .update(setupsV0)
         .set({
           status: "INVALIDATED",
           invalidatedAt: new Date(),
           invalidationReason: reason,
         })
         .where(eq(setupsV0.id, setupId));
     }

     async getSetupWithSignals(setupId: number) {
       const setup = await this.db
         .select()
         .from(setupsV0)
         .where(eq(setupsV0.id, setupId))
         .limit(1);

       if (setup.length === 0) return null;

       const signals = await this.db
         .select()
         .from(setupSignalsV0)
         .where(eq(setupSignalsV0.setupId, setupId));

       return {
         ...setup[0],
         signals,
       };
     }
   }
   ```

### Expected Output

- Repository for setup operations created
- Can save, approve, invalidate setups

### Files Created/Modified

- `apps/botbox/src/db/setups-repository.ts` (create)

---

## Task 4.5: Create Risk Calculator (25 mins)

### Description

Build risk management module to calculate position sizes and validate limits.

### Steps

1. Create `apps/botbox/src/trading/risk-calculator.ts`:

   ```typescript
   export interface RiskParameters {
     accountBalance: number;
     riskPerTradePercent: number;
     maxPositionSizePercent: number;
     maxOpenPositions: number;
   }

   export interface PositionSizing {
     positionSize: number;
     positionValue: number;
     riskAmount: number;
     rMultiple: number;
     isValid: boolean;
     errors: string[];
   }

   export class RiskCalculator {
     constructor(private riskParams: RiskParameters) {}

     calculatePositionSize(
       entryPrice: number,
       stopLoss: number,
       currentOpenPositions: number
     ): PositionSizing {
       const errors: string[] = [];

       if (currentOpenPositions >= this.riskParams.maxOpenPositions) {
         errors.push(
           `Max open positions reached (${this.riskParams.maxOpenPositions})`
         );
       }

       const riskAmount =
         this.riskParams.accountBalance *
         (this.riskParams.riskPerTradePercent / 100);
       const stopDistance = Math.abs(entryPrice - stopLoss);

       if (stopDistance === 0) {
         errors.push("Stop loss distance is zero");
         return {
           positionSize: 0,
           positionValue: 0,
           riskAmount,
           rMultiple: 0,
           isValid: false,
           errors,
         };
       }

       const positionSize = riskAmount / stopDistance;
       const positionValue = positionSize * entryPrice;

       const maxPositionValue =
         this.riskParams.accountBalance *
         (this.riskParams.maxPositionSizePercent / 100);

       if (positionValue > maxPositionValue) {
         errors.push(
           `Position value $${positionValue.toFixed(2)} exceeds max ` +
             `$${maxPositionValue.toFixed(2)} (${
               this.riskParams.maxPositionSizePercent
             }% of account)`
         );
       }

       const rMultiple = stopDistance / entryPrice;

       return {
         positionSize,
         positionValue,
         riskAmount,
         rMultiple,
         isValid: errors.length === 0,
         errors,
       };
     }

     validateTrade(
       entryPrice: number,
       stopLoss: number,
       takeProfit1: number,
       takeProfit2: number
     ): { isValid: boolean; errors: string[] } {
       const errors: string[] = [];

       const isLong = entryPrice < takeProfit1;

       if (isLong) {
         if (stopLoss >= entryPrice) {
           errors.push("Long trade: stop loss must be below entry");
         }
         if (takeProfit1 <= entryPrice || takeProfit2 <= entryPrice) {
           errors.push("Long trade: take profits must be above entry");
         }
       } else {
         if (stopLoss <= entryPrice) {
           errors.push("Short trade: stop loss must be above entry");
         }
         if (takeProfit1 >= entryPrice || takeProfit2 >= entryPrice) {
           errors.push("Short trade: take profits must be below entry");
         }
       }

       return { isValid: errors.length === 0, errors };
     }
   }
   ```

### Expected Output

- Risk calculator created
- Position sizing based on 1% risk
- Validates max position size (10% of account)

### Files Created/Modified

- `apps/botbox/src/trading/risk-calculator.ts` (create)

---

## Task 4.6: Create Setup Invalidation Logic (20 mins)

### Description

Build service to check if active setups should be invalidated due to changed conditions.

### Steps

1. Create `apps/botbox/src/trading/setup-invalidator.ts`:

   ```typescript
   import { createDbConnection } from "../db/connection";
   import { setupsV0, candles } from "../db/schema";
   import { eq, and, desc } from "drizzle-orm";
   import { SetupsRepository } from "../db/setups-repository";

   export class SetupInvalidator {
     constructor(
       private db: ReturnType<typeof createDbConnection>,
       private setupsRepo: SetupsRepository
     ) {}

     async checkInvalidations(): Promise<{
       invalidated: number;
       reasons: Record<number, string>;
     }> {
       const activeSetups = await this.setupsRepo.getActiveSetups();

       const results = {
         invalidated: 0,
         reasons: {} as Record<number, string>,
       };

       for (const setup of activeSetups) {
         const reason = await this.shouldInvalidate(setup);

         if (reason) {
           await this.setupsRepo.invalidateSetup(setup.id, reason);
           results.invalidated++;
           results.reasons[setup.id] = reason;
           console.log(`✗ Invalidated setup ${setup.id}: ${reason}`);
         }
       }

       return results;
     }

     private async shouldInvalidate(setup: any): Promise<string | null> {
       const ageHours =
         (Date.now() - setup.detectedAt.getTime()) / (1000 * 60 * 60);

       if (ageHours > 24) {
         return "Setup expired (>24 hours old)";
       }

       const latestCandle = await this.db
         .select()
         .from(candles)
         .where(
           and(
             eq(candles.instrumentId, setup.instrumentId),
             eq(candles.timeframe, setup.timeframe)
           )
         )
         .orderBy(desc(candles.timestamp))
         .limit(1);

       if (latestCandle.length === 0) return null;

       const candle = latestCandle[0];
       const currentPrice = parseFloat(candle.close);
       const entryPrice = parseFloat(setup.entryPrice);
       const atr = parseFloat(candle.atr || "0");

       if (atr === 0) return null;

       const priceMove = Math.abs(currentPrice - entryPrice);

       if (priceMove > 2 * atr) {
         return `Price moved too far (${priceMove.toFixed(2)} > ${(
           2 * atr
         ).toFixed(2)} 2×ATR)`;
       }

       return null;
     }
   }
   ```

### Expected Output

- Setup invalidator service created
- Invalidates setups older than 24 hours
- Invalidates if price moved > 2× ATR away

### Files Created/Modified

- `apps/botbox/src/trading/setup-invalidator.ts` (create)

---

## Task 4.7: Add Trading Mode Configuration (15 mins)

### Description

Add configuration toggle between real trading (executes orders) and logging mode (paper trading, default).

### Steps

1. Create `apps/botbox/src/trading/trading-config.ts`:

   ```typescript
   export enum TradingMode {
     LOGGING = "LOGGING", // Paper trading - logs trades only (default)
     REAL = "REAL", // Real trading - executes actual orders
   }

   export interface TradingConfig {
     mode: TradingMode;
     accountBalance: number; // Virtual balance for logging mode
   }

   export function getTradingConfig(env: {
     TRADING_MODE?: string;
     VIRTUAL_BALANCE?: string;
   }): TradingConfig {
     const mode = (env.TRADING_MODE?.toUpperCase() || "LOGGING") as TradingMode;
     const accountBalance = parseFloat(env.VIRTUAL_BALANCE || "10000");

     return {
       mode: mode === TradingMode.REAL ? TradingMode.REAL : TradingMode.LOGGING,
       accountBalance,
     };
   }
   ```

2. Update `.dev.vars`:
   ```env
   TRADING_MODE=LOGGING  # or REAL for actual execution
   VIRTUAL_BALANCE=10000  # Starting balance for logging mode
   ```

### Expected Output

- Trading mode configuration created
- Default is LOGGING mode (paper trading)
- Can toggle to REAL mode for actual execution

### Files Created/Modified

- `apps/botbox/src/trading/trading-config.ts` (create)
- `apps/botbox/.dev.vars` (modify)

---

## Task 4.8: Update Schema for Trade Type Tracking (10 mins)

### Description

Add field to distinguish between real trades and mock/logged trades in database.

### Steps

1. Update `apps/botbox/src/db/schema/trades.schema.ts` (PostgreSQL version):

   ```typescript
   // Add to trades table definition:
   tradeType: varchar('trade_type', { length: 20 })
     .notNull()
     .default('MOCK'),  // 'MOCK' for logging, 'REAL' for actual trades
   ```

2. Update `apps/botbox/src/db/schema/orders.schema.ts` (PostgreSQL version):

   ```typescript
   // Add to orders table definition:
   tradeType: varchar('trade_type', { length: 20 })
     .notNull()
     .default('MOCK'),  // 'MOCK' for logging, 'REAL' for actual trades
   exchangeOrderId: varchar('exchange_order_id', { length: 100 }),  // Null for mock orders
   ```

3. Generate and run migration:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Expected Output

- Trades and orders tables track trade type
- Can filter statistics by real vs mock trades

### Files Created/Modified

- `apps/botbox/src/db/schema/trades.schema.ts` (modify)
- `apps/botbox/src/db/schema/orders.schema.ts` (modify)

---

## Task 4.9: Create Mock Trade Executor (25 mins)

### Description

Build mock trade executor for logging mode that simulates trades without placing real orders.

### Steps

1. Create `apps/botbox/src/trading/mock-trade-executor.ts`:

   ```typescript
   import { createDbConnection } from "../db/connection";
   import { trades, orders, setupsV0 } from "../db/schema";
   import { RiskCalculator } from "./risk-calculator";
   import { eq } from "drizzle-orm";

   export interface MockTradeExecutionResult {
     tradeId: number;
     orderIds: string[];
     success: boolean;
     simulatedPrice: number;
     message: string;
   }

   export class MockTradeExecutor {
     constructor(
       private db: ReturnType<typeof createDbConnection>,
       private riskCalculator: RiskCalculator,
       private virtualBalance: number
     ) {}

     async executeSetup(
       setupId: number,
       currentPrice: number
     ): Promise<MockTradeExecutionResult> {
       const setup = await this.db
         .select()
         .from(setupsV0)
         .where(eq(setupsV0.id, setupId))
         .limit(1);

       if (setup.length === 0) {
         throw new Error(`Setup ${setupId} not found`);
       }

       const setupData = setup[0];

       if (setupData.status !== "APPROVED") {
         throw new Error(
           `Setup ${setupId} is not approved (status: ${setupData.status})`
         );
       }

       const entry = parseFloat(setupData.entryPrice);
       const sl = parseFloat(setupData.stopLoss);

       const openTrades = await this.db
         .select()
         .from(trades)
         .where(eq(trades.status, "OPEN"));

       const sizing = this.riskCalculator.calculatePositionSize(
         entry,
         sl,
         openTrades.length
       );

       if (!sizing.isValid) {
         throw new Error(`Risk validation failed: ${sizing.errors.join(", ")}`);
       }

       const isLong = entry < parseFloat(setupData.takeProfit1);
       const side = isLong ? "Buy" : "Sell";

       // Simulate order execution at current market price (with slight slippage)
       const slippage = isLong ? 1.001 : 0.999; // 0.1% slippage
       const simulatedPrice = currentPrice * slippage;

       console.log(
         `[MockTradeExecutor] Simulating ${side} order: ` +
           `${setupData.symbol} @ ${simulatedPrice.toFixed(2)} ` +
           `(size: ${sizing.positionSize.toFixed(4)})`
       );

       const mockOrderId = `MOCK-${Date.now()}-${Math.random()
         .toString(36)
         .substr(2, 9)}`;

       const [trade] = await this.db
         .insert(trades)
         .values({
           setupId,
           instrumentId: setupData.instrumentId,
           direction: isLong ? "LONG" : "SHORT",
           entryPrice: simulatedPrice.toString(),
           stopLoss: sl.toString(),
           takeProfit1: parseFloat(setupData.takeProfit1).toString(),
           takeProfit2: parseFloat(setupData.takeProfit2).toString(),
           quantity: sizing.positionSize.toString(),
           status: "OPEN",
           entryTime: new Date(),
           tradeType: "MOCK", // Mark as mock trade
         })
         .returning({ id: trades.id });

       await this.db.insert(orders).values({
         tradeId: trade.id,
         orderType: "MARKET",
         side: side.toLowerCase(),
         price: simulatedPrice.toString(),
         quantity: sizing.positionSize.toString(),
         status: "FILLED",
         exchangeOrderId: null, // No real exchange order
         tradeType: "MOCK", // Mark as mock order
         filledAt: new Date(),
       });

       await this.db
         .update(setupsV0)
         .set({ status: "TRIGGERED" })
         .where(eq(setupsV0.id, setupId));

       const message =
         `Mock trade executed: ${side} ${sizing.positionSize.toFixed(4)} ` +
         `${setupData.symbol} @ ${simulatedPrice.toFixed(
           2
         )} (virtual balance: $${this.virtualBalance.toFixed(2)})`;

       console.log(`[MockTradeExecutor] ${message}`);

       return {
         tradeId: trade.id,
         orderIds: [mockOrderId],
         success: true,
         simulatedPrice,
         message,
       };
     }
   }
   ```

### Expected Output

- Mock trade executor created
- Simulates trades without placing real orders
- Logs all trade details with "MOCK" type

### Files Created/Modified

- `apps/botbox/src/trading/mock-trade-executor.ts` (create)

---

## Task 4.10: Update Trade Executor with Mode Support (20 mins)

### Description

Modify real trade executor to work with mode toggle and ensure both executors log trades properly.

### Steps

1. Update `apps/botbox/src/trading/trade-executor.ts` (from Phase 6, but add here):

   ```typescript
   // Add tradeType field to trade insertion:
   .values({
     // ... existing fields ...
     tradeType: 'REAL',  // Mark as real trade
   })

   // Add tradeType and exchangeOrderId to order insertion:
   .values({
     // ... existing fields ...
     tradeType: 'REAL',
     exchangeOrderId: entryOrder.orderId,  // Real exchange order ID
   })
   ```

2. Create `apps/botbox/src/trading/trade-executor-factory.ts`:

   ```typescript
   import { TradingMode, TradingConfig } from "./trading-config";
   import { TradeExecutor } from "./trade-executor";
   import { MockTradeExecutor } from "./mock-trade-executor";
   import { BybitAdapter } from "@repo/core/exchanges/bybit-adapter";
   import { createDbConnection } from "../db/connection";
   import { RiskCalculator } from "./risk-calculator";

   export interface ITradeExecutor {
     executeSetup(setupId: number, currentPrice?: number): Promise<any>;
   }

   export class TradeExecutorFactory {
     static create(
       config: TradingConfig,
       db: ReturnType<typeof createDbConnection>,
       exchange?: BybitAdapter,
       riskCalculator?: RiskCalculator
     ): ITradeExecutor {
       if (config.mode === TradingMode.REAL) {
         if (!exchange || !riskCalculator) {
           throw new Error(
             "Exchange and RiskCalculator required for REAL trading mode"
           );
         }
         return new TradeExecutor(db, exchange, riskCalculator);
       } else {
         if (!riskCalculator) {
           throw new Error("RiskCalculator required for LOGGING trading mode");
         }
         return new MockTradeExecutor(
           db,
           riskCalculator,
           config.accountBalance
         );
       }
     }
   }
   ```

### Expected Output

- Trade executor factory created
- Automatically selects mock or real executor based on config
- Both executors properly mark trade types

### Files Created/Modified

- `apps/botbox/src/trading/trade-executor-factory.ts` (create)
- `apps/botbox/src/trading/trade-executor.ts` (modify - reference from Phase 6)

---

## Task 4.11: Build Trading Loop Orchestrator (30 mins)

### Description

Create the main orchestration service that coordinates all trading logic with mode support.

### Steps

1. Create `apps/botbox/src/trading/trading-loop.ts`:

   ```typescript
   import { createDbConnection } from "../db/connection";
   import { RegimeDetector } from "./regime-detector";
   import { SetupScanner } from "./setup-scanner";
   import { SetupInvalidator } from "./setup-invalidator";
   import { SetupsRepository } from "../db/setups-repository";
   import {
     TradingConfig,
     TradingMode,
     getTradingConfig,
   } from "./trading-config";
   import { TradeExecutorFactory } from "./trade-executor-factory";
   import { RiskCalculator } from "./risk-calculator";
   import { jobLogs } from "../db/schema";

   export class TradingLoop {
     private config: TradingConfig;

     constructor(
       private db: ReturnType<typeof createDbConnection>,
       env: { TRADING_MODE?: string; VIRTUAL_BALANCE?: string }
     ) {
       this.config = getTradingConfig(env);
     }

     async run(): Promise<{
       setupsDetected: number;
       setupsInvalidated: number;
       tradingMode: TradingMode;
       errors: string[];
     }> {
       const startTime = Date.now();
       const errors: string[] = [];

       const modeLabel =
         this.config.mode === TradingMode.REAL
           ? "REAL"
           : "LOGGING (Paper Trading)";
       const logMessage = `Trading loop started [Mode: ${modeLabel}]`;

       await this.db.insert(jobLogs).values({
         jobType: "TRADING_LOOP",
         status: "RUNNING",
         message: logMessage,
         startedAt: new Date(),
       });

       try {
         console.log(`[TradingLoop] Starting... [Mode: ${modeLabel}]`);

         const regimeDetector = new RegimeDetector(this.db);
         const setupScanner = new SetupScanner(this.db, regimeDetector);
         const setupsRepo = new SetupsRepository(this.db);
         const setupInvalidator = new SetupInvalidator(this.db, setupsRepo);

         console.log("[TradingLoop] Checking setup invalidations...");
         const invalidationResults =
           await setupInvalidator.checkInvalidations();
         console.log(
           `[TradingLoop] Invalidated ${invalidationResults.invalidated} setups`
         );

         console.log("[TradingLoop] Scanning for new setups...");
         const detectedSetups = await setupScanner.scanForSetups("60");
         console.log(`[TradingLoop] Detected ${detectedSetups.length} setups`);

         for (const setup of detectedSetups) {
           try {
             const setupId = await setupsRepo.createSetup(setup);
             console.log(
               `✓ Created setup ${setupId}: ${setup.symbol} ${setup.setupType} ` +
                 `@ ${setup.entryPrice.toFixed(2)}`
             );
           } catch (error) {
             const errMsg = `Failed to save setup for ${setup.symbol}: ${error.message}`;
             errors.push(errMsg);
             console.error(`✗ ${errMsg}`);
           }
         }

         const duration = Date.now() - startTime;

         await this.db.insert(jobLogs).values({
           jobType: "TRADING_LOOP",
           status: "COMPLETED",
           message: `Detected ${detectedSetups.length} setups, invalidated ${invalidationResults.invalidated} [Mode: ${modeLabel}]`,
           startedAt: new Date(startTime),
           completedAt: new Date(),
           durationMs: duration,
         });

         console.log(
           `[TradingLoop] Complete (${duration}ms) [Mode: ${modeLabel}]`
         );

         return {
           setupsDetected: detectedSetups.length,
           setupsInvalidated: invalidationResults.invalidated,
           tradingMode: this.config.mode,
           errors,
         };
       } catch (error) {
         const duration = Date.now() - startTime;

         await this.db.insert(jobLogs).values({
           jobType: "TRADING_LOOP",
           status: "FAILED",
           error: error.message,
           startedAt: new Date(startTime),
           completedAt: new Date(),
           durationMs: duration,
         });

         throw error;
       }
     }
   }
   ```

### Expected Output

- Trading loop orchestrator created
- Coordinates regime detection, setup scanning, invalidation
- Logs all operations to job_logs table

### Files Created/Modified

- `apps/botbox/src/trading/trading-loop.ts` (create)

---

## Task 4.12: Create Trade Statistics Query Helper (15 mins)

### Description

Create helper functions to query trade statistics separately for real vs mock trades.

### Steps

1. Create `apps/botbox/src/trading/trade-statistics.ts`:

   ```typescript
   import { createDbConnection } from "../db/connection";
   import { trades } from "../db/schema";
   import { eq, and, sql } from "drizzle-orm";

   export interface TradeStatistics {
     totalTrades: number;
     realTrades: number;
     mockTrades: number;
     openTrades: number;
     closedTrades: number;
     wins: number;
     losses: number;
     winRate: number;
     totalPnl: number;
     avgPnl: number;
   }

   export class TradeStatisticsService {
     constructor(private db: ReturnType<typeof createDbConnection>) {}

     async getStatistics(
       tradeType?: "REAL" | "MOCK"
     ): Promise<TradeStatistics> {
       let query = this.db.select().from(trades);

       if (tradeType) {
         query = query.where(eq(trades.tradeType, tradeType));
       }

       const allTrades = await query;

       const realTrades = allTrades.filter((t) => t.tradeType === "REAL");
       const mockTrades = allTrades.filter((t) => t.tradeType === "MOCK");
       const closedTrades = allTrades.filter((t) => t.status === "CLOSED");
       const openTrades = allTrades.filter((t) => t.status === "OPEN");

       const wins = closedTrades.filter((t) => {
         const pnl = parseFloat(t.realizedPnl || "0");
         return pnl > 0;
       }).length;

       const losses = closedTrades.filter((t) => {
         const pnl = parseFloat(t.realizedPnl || "0");
         return pnl < 0;
       }).length;

       const totalPnl = closedTrades.reduce((sum, t) => {
         return sum + parseFloat(t.realizedPnl || "0");
       }, 0);

       const winRate =
         closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

       const avgPnl =
         closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;

       return {
         totalTrades: allTrades.length,
         realTrades: realTrades.length,
         mockTrades: mockTrades.length,
         openTrades: openTrades.length,
         closedTrades: closedTrades.length,
         wins,
         losses,
         winRate,
         totalPnl,
         avgPnl,
       };
     }

     async getRealTradeStatistics(): Promise<TradeStatistics> {
       return this.getStatistics("REAL");
     }

     async getMockTradeStatistics(): Promise<TradeStatistics> {
       return this.getStatistics("MOCK");
     }
   }
   ```

### Expected Output

- Trade statistics service created
- Can query stats for real trades, mock trades, or both
- Provides win rate, P&L, and other metrics

### Files Created/Modified

- `apps/botbox/src/trading/trade-statistics.ts` (create)

---

## Task 4.13: Create Manual Test Script (15 mins)

### Description

Build a script to test the trading loop locally before deploying to cron.

### Steps

1. Create `apps/botbox/scripts/test-trading-loop.ts`:

   ```typescript
   import { config } from "dotenv";
   import { createDbConnection } from "../src/db/connection";
   import { TradingLoop } from "../src/trading/trading-loop";
   import { TradeStatisticsService } from "../src/trading/trade-statistics";

   config({ path: ".dev.vars" });

   async function testTradingLoop() {
     const db = createDbConnection(process.env.NEON_URL!);

     console.log("Testing trading loop...\n");
     console.log(
       `Trading Mode: ${process.env.TRADING_MODE || "LOGGING (default)"}`
     );
     console.log(
       `Virtual Balance: $${process.env.VIRTUAL_BALANCE || "10000"}\n`
     );

     const loop = new TradingLoop(db, {
       TRADING_MODE: process.env.TRADING_MODE,
       VIRTUAL_BALANCE: process.env.VIRTUAL_BALANCE,
     });
     const results = await loop.run();

     console.log("\n✓ Trading loop test complete");
     console.log(`Trading Mode: ${results.tradingMode}`);
     console.log(`Setups detected: ${results.setupsDetected}`);
     console.log(`Setups invalidated: ${results.setupsInvalidated}`);

     if (results.errors.length > 0) {
       console.log(`\nErrors: ${results.errors.length}`);
       results.errors.forEach((err) => console.log(`  - ${err}`));
     }

     // Show trade statistics
     const statsService = new TradeStatisticsService(db);
     const allStats = await statsService.getStatistics();
     const mockStats = await statsService.getMockTradeStatistics();
     const realStats = await statsService.getRealTradeStatistics();

     console.log("\n=== Trade Statistics ===");
     console.log(
       `Total Trades: ${allStats.totalTrades} (${allStats.realTrades} real, ${allStats.mockTrades} mock)`
     );
     console.log(`Open Trades: ${allStats.openTrades}`);
     console.log(`Closed Trades: ${allStats.closedTrades}`);
     if (allStats.closedTrades > 0) {
       console.log(
         `Win Rate: ${allStats.winRate.toFixed(1)}% (${allStats.wins}W/${
           allStats.losses
         }L)`
       );
       console.log(`Total P&L: $${allStats.totalPnl.toFixed(2)}`);
       console.log(`Avg P&L: $${allStats.avgPnl.toFixed(2)}`);
     }

     if (mockStats.closedTrades > 0) {
       console.log(
         `\nMock Trades: ${
           mockStats.closedTrades
         } closed, ${mockStats.winRate.toFixed(
           1
         )}% win rate, $${mockStats.totalPnl.toFixed(2)} P&L`
       );
     }

     if (realStats.closedTrades > 0) {
       console.log(
         `\nReal Trades: ${
           realStats.closedTrades
         } closed, ${realStats.winRate.toFixed(
           1
         )}% win rate, $${realStats.totalPnl.toFixed(2)} P&L`
       );
     }

     process.exit(0);
   }

   testTradingLoop().catch((error) => {
     console.error("Trading loop test failed:", error);
     process.exit(1);
   });
   ```

2. Add to package.json:

   ```json
   "test:trading": "tsx scripts/test-trading-loop.ts"
   ```

3. Run test:
   ```bash
   npm run test:trading
   ```

### Expected Output

```
Testing trading loop...
Trading Mode: LOGGING (default)
Virtual Balance: $10000

[TradingLoop] Starting... [Mode: LOGGING (Paper Trading)]
[TradingLoop] Checking setup invalidations...
[TradingLoop] Invalidated 0 setups
[TradingLoop] Scanning for new setups...
  [BTCUSDT] Skipping - market is TRENDING
  [ETHUSDT] Skipping - market is TRENDING
  [SOLUSDT] Market is RANGING
✓ Created setup 1: SOLUSDT LOWER_BB_BOUNCE @ 102.35
[TradingLoop] Detected 1 setups
[TradingLoop] Complete (2543ms) [Mode: LOGGING (Paper Trading)]

✓ Trading loop test complete
Trading Mode: LOGGING
Setups detected: 1
Setups invalidated: 0

=== Trade Statistics ===
Total Trades: 5 (0 real, 5 mock)
Open Trades: 2
Closed Trades: 3
Win Rate: 66.7% (2W/1L)
Total P&L: $45.23
Avg P&L: $15.08

Mock Trades: 3 closed, 66.7% win rate, $45.23 P&L
```

### Files Created/Modified

- `apps/botbox/scripts/test-trading-loop.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Checkpoint: Phase 4 Complete

### Verification Checklist

- [ ] Trading mode configuration created (default: LOGGING)
- [ ] Schema updated with tradeType field
- [ ] Mock trade executor simulates trades without real orders
- [ ] Real trade executor marks trades as REAL type
- [ ] Trade executor factory selects correct executor based on mode
- [ ] Regime detector implemented (ATR-based)
- [ ] Setup scanner detects Lower BB Bounce
- [ ] Setup scanner detects Upper BB Rejection
- [ ] Setups database tables created
- [ ] Setup persistence repository works
- [ ] Risk calculator validates position sizing
- [ ] Setup invalidator expires old setups
- [ ] Trading loop orchestrator coordinates all logic with mode support
- [ ] Trade statistics service can filter real vs mock trades
- [ ] Manual test successfully detects setups and shows mode

### Test the Full Flow

```bash
npm run test:trading
```

Should detect 0-3 setups depending on current market conditions.

### Next Phase

Proceed to `05-approval-dashboard.md` - Build TradingView chart UI for setup approval
