# Phase 3: Indicator Calculation Engine

## Overview
Install technical indicator library and calculate BB, RSI, ATR for all historical and new candles.

**Estimated Time**: 3-4 hours (Week 1, Days 5-7)

---

## Task 3.1: Install ta Library (5 mins)

### Description
Install the TypeScript technical indicators library.

### Steps
1. Install dependencies:
   ```bash
   cd apps/botbox
   npm install technicalindicators
   npm install --save-dev @types/technicalindicators
   ```

2. Test import in a TypeScript file to verify installation

### Expected Output
- Library installed successfully
- TypeScript types available

### Files Created/Modified
- `apps/botbox/package.json` (dependencies)

---

## Task 3.2: Create Indicator Calculator Module (20 mins)

### Description
Build a service to calculate all required indicators from candle data.

### Steps
1. Create `apps/botbox/src/services/indicator-calculator.ts`:
   ```typescript
   import { BB, RSI, ATR, SMA } from 'technicalindicators'

   export interface CandleInput {
     timestamp: Date
     open: number
     high: number
     low: number
     close: number
     volume: number
   }

   export interface IndicatorResult {
     timestamp: Date
     bbUpper: number | null
     bbMiddle: number | null
     bbLower: number | null
     rsi: number | null
     atr: number | null
     volumeMa: number | null
   }

   export class IndicatorCalculator {
     calculateAll(candles: CandleInput[]): IndicatorResult[] {
       if (candles.length < 20) {
         throw new Error('Need at least 20 candles for indicators')
       }

       const closes = candles.map(c => c.close)
       const highs = candles.map(c => c.high)
       const lows = candles.map(c => c.low)
       const volumes = candles.map(c => c.volume)

       const bbResults = BB.calculate({
         period: 20,
         values: closes,
         stdDev: 2,
       })

       const rsiResults = RSI.calculate({
         period: 14,
         values: closes,
       })

       const atrResults = ATR.calculate({
         period: 14,
         high: highs,
         low: lows,
         close: closes,
       })

       const volumeMaResults = SMA.calculate({
         period: 20,
         values: volumes,
       })

       const results: IndicatorResult[] = []

       for (let i = 0; i < candles.length; i++) {
         const bbIndex = i - (20 - 1)
         const rsiIndex = i - (14 - 1)
         const atrIndex = i - (14 - 1)
         const volumeMaIndex = i - (20 - 1)

         results.push({
           timestamp: candles[i].timestamp,
           bbUpper: bbIndex >= 0 ? bbResults[bbIndex].upper : null,
           bbMiddle: bbIndex >= 0 ? bbResults[bbIndex].middle : null,
           bbLower: bbIndex >= 0 ? bbResults[bbIndex].lower : null,
           rsi: rsiIndex >= 0 ? rsiResults[rsiIndex] : null,
           atr: atrIndex >= 0 ? atrResults[atrIndex] : null,
           volumeMa: volumeMaIndex >= 0 ? volumeMaResults[volumeMaIndex] : null,
         })
       }

       return results
     }

     calculateForLatest(candles: CandleInput[]): IndicatorResult {
       const results = this.calculateAll(candles)
       return results[results.length - 1]
     }
   }
   ```

### Expected Output
- Indicator calculator service created
- Handles all required indicators (BB, RSI, ATR, Volume MA)

### Files Created/Modified
- `apps/botbox/src/services/indicator-calculator.ts` (create)

---

## Task 3.3: Create Indicator Update Repository (15 mins)

### Description
Build database functions to update candles with calculated indicators.

### Steps
1. Create `apps/botbox/src/db/indicators-repository.ts`:
   ```typescript
   import { createDbConnection } from './connection'
   import { candles } from './schema'
   import { eq, and } from 'drizzle-orm'
   import { IndicatorResult } from '../services/indicator-calculator'

   export class IndicatorsRepository {
     constructor(private db: ReturnType<typeof createDbConnection>) {}

     async updateIndicators(
       instrumentId: number,
       timeframe: string,
       indicators: IndicatorResult[]
     ): Promise<void> {
       for (const indicator of indicators) {
         await this.db
           .update(candles)
           .set({
             bbUpper: indicator.bbUpper?.toString(),
             bbMiddle: indicator.bbMiddle?.toString(),
             bbLower: indicator.bbLower?.toString(),
             rsi: indicator.rsi?.toString(),
             atr: indicator.atr?.toString(),
             volumeMa: indicator.volumeMa?.toString(),
           })
           .where(
             and(
               eq(candles.instrumentId, instrumentId),
               eq(candles.timeframe, timeframe),
               eq(candles.timestamp, indicator.timestamp)
             )
           )
       }
     }

     async batchUpdateIndicators(
       instrumentId: number,
       timeframe: string,
       indicators: IndicatorResult[]
     ): Promise<void> {
       const batchSize = 100

       for (let i = 0; i < indicators.length; i += batchSize) {
         const batch = indicators.slice(i, i + batchSize)
         await this.updateIndicators(instrumentId, timeframe, batch)

         if (i % 1000 === 0 && i > 0) {
           console.log(`  Updated ${i}/${indicators.length} candles`)
         }
       }
     }
   }
   ```

### Expected Output
- Repository for updating indicators created
- Batch processing for efficiency

### Files Created/Modified
- `apps/botbox/src/db/indicators-repository.ts` (create)

---

## Task 3.4: Build Indicator Backfill Script (20 mins)

### Description
Create script to calculate indicators for all historical candles.

### Steps
1. Create `apps/botbox/scripts/backfill-indicators.ts`:
   ```typescript
   import { config } from 'dotenv'
   import { createDbConnection } from '../src/db/connection'
   import { candles, instruments } from '../src/db/schema'
   import { IndicatorCalculator, CandleInput } from '../src/services/indicator-calculator'
   import { IndicatorsRepository } from '../src/db/indicators-repository'
   import { eq, and, asc } from 'drizzle-orm'

   config({ path: '.dev.vars' })

   const TIMEFRAMES = ['60', '240', 'D', 'W']

   async function backfillIndicators() {
     const db = createDbConnection(process.env.NEON_URL!)
     const calculator = new IndicatorCalculator()
     const indicatorsRepo = new IndicatorsRepository(db)

     const allInstruments = await db
       .select()
       .from(instruments)
       .where(eq(instruments.isActive, true))

     console.log(`Starting indicator backfill for ${allInstruments.length} instruments...\n`)

     let totalProcessed = 0

     for (const instrument of allInstruments) {
       console.log(`[${instrument.symbol}] Starting indicator calculation...`)

       for (const timeframe of TIMEFRAMES) {
         const startTime = Date.now()

         const candleData = await db
           .select()
           .from(candles)
           .where(
             and(
               eq(candles.instrumentId, instrument.id),
               eq(candles.timeframe, timeframe)
             )
           )
           .orderBy(asc(candles.timestamp))

         if (candleData.length < 20) {
           console.log(`  [${timeframe}] Skipping (only ${candleData.length} candles)`)
           continue
         }

         console.log(`  [${timeframe}] Calculating for ${candleData.length} candles...`)

         const candleInput: CandleInput[] = candleData.map(c => ({
           timestamp: c.timestamp,
           open: parseFloat(c.open),
           high: parseFloat(c.high),
           low: parseFloat(c.low),
           close: parseFloat(c.close),
           volume: parseFloat(c.volume),
         }))

         const indicators = calculator.calculateAll(candleInput)

         console.log(`  [${timeframe}] Updating database...`)
         await indicatorsRepo.batchUpdateIndicators(
           instrument.id,
           timeframe,
           indicators
         )

         const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
         console.log(`  [${timeframe}] ✓ Complete (${elapsed}s)`)

         totalProcessed += candleData.length
       }

       console.log(`  ✓ ${instrument.symbol} complete\n`)
     }

     console.log(`✓ Indicator backfill complete!`)
     console.log(`Total candles processed: ${totalProcessed.toLocaleString()}`)
     process.exit(0)
   }

   backfillIndicators().catch(error => {
     console.error('Indicator backfill failed:', error)
     process.exit(1)
   })
   ```

2. Add to package.json:
   ```json
   "db:backfill-indicators": "tsx scripts/backfill-indicators.ts"
   ```

### Expected Output
- Script created to calculate all indicators
- Processes ~227,000 candles

### Files Created/Modified
- `apps/botbox/scripts/backfill-indicators.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Task 3.5: Run Indicator Backfill (20-30 mins execution)

### Description
Execute the indicator backfill script to populate all historical candles.

### Steps
1. Run the backfill:
   ```bash
   cd apps/botbox
   npm run db:backfill-indicators
   ```

2. Monitor progress (takes 15-25 minutes)

### Expected Output
```
Starting indicator backfill for 10 instruments...

[BTCUSDT] Starting indicator calculation...
  [60] Calculating for 17520 candles...
  [60] Updating database...
  Updated 1000/17520 candles
  Updated 2000/17520 candles
  ...
  [60] ✓ Complete (45.2s)
  [240] Calculating for 4380 candles...
  [240] ✓ Complete (12.1s)
  ...
  ✓ BTCUSDT complete

...

✓ Indicator backfill complete!
Total candles processed: 227,340
```

### Files Created/Modified
None (data operation)

---

## Task 3.6: Verify Indicator Calculation (15 mins)

### Description
Create verification script to check indicator data quality.

### Steps
1. Create `apps/botbox/scripts/verify-indicators.ts`:
   ```typescript
   import { config } from 'dotenv'
   import { createDbConnection } from '../src/db/connection'
   import { candles, instruments } from '../src/db/schema'
   import { sql } from 'drizzle-orm'

   config({ path: '.dev.vars' })

   async function verifyIndicators() {
     const db = createDbConnection(process.env.NEON_URL!)

     console.log('Verifying indicator calculations...\n')

     const stats = await db.execute(sql`
       SELECT
         i.symbol,
         c.timeframe,
         COUNT(*) as total,
         COUNT(c.bb_upper) as bb_count,
         COUNT(c.rsi) as rsi_count,
         COUNT(c.atr) as atr_count,
         AVG(CASE WHEN c.rsi IS NOT NULL THEN c.rsi::float ELSE NULL END) as avg_rsi,
         COUNT(CASE WHEN c.bb_lower IS NOT NULL AND c.close::float < c.bb_lower::float THEN 1 END) as below_bb
       FROM candles c
       JOIN instruments i ON c.instrument_id = i.id
       GROUP BY i.symbol, c.timeframe
       ORDER BY i.symbol, c.timeframe
     `)

     console.log('Symbol       | TF  | Total  | BB%  | RSI% | ATR% | Avg RSI | Below BB')
     console.log('-'.repeat(90))

     for (const row of stats.rows) {
       const bbPct = ((row.bb_count / row.total) * 100).toFixed(1)
       const rsiPct = ((row.rsi_count / row.total) * 100).toFixed(1)
       const atrPct = ((row.atr_count / row.total) * 100).toFixed(1)
       const avgRsi = row.avg_rsi ? parseFloat(row.avg_rsi).toFixed(1) : 'N/A'

       console.log(
         `${row.symbol.padEnd(12)} | ${row.timeframe.padEnd(3)} | ` +
         `${row.total.toString().padStart(6)} | ${bbPct.padStart(4)}% | ` +
         `${rsiPct.padStart(4)}% | ${atrPct.padStart(4)}% | ${avgRsi.padStart(7)} | ${row.below_bb}`
       )
     }

     const sampleCandle = await db.execute(sql`
       SELECT
         i.symbol,
         c.timestamp,
         c.close,
         c.bb_upper,
         c.bb_middle,
         c.bb_lower,
         c.rsi,
         c.atr
       FROM candles c
       JOIN instruments i ON c.instrument_id = i.id
       WHERE c.bb_upper IS NOT NULL
       ORDER BY c.timestamp DESC
       LIMIT 1
     `)

     if (sampleCandle.rows.length > 0) {
       const sample = sampleCandle.rows[0]
       console.log(`\nSample candle (latest with indicators):`)
       console.log(`  Symbol: ${sample.symbol}`)
       console.log(`  Time: ${sample.timestamp}`)
       console.log(`  Close: ${sample.close}`)
       console.log(`  BB: ${sample.bb_lower} / ${sample.bb_middle} / ${sample.bb_upper}`)
       console.log(`  RSI: ${sample.rsi}`)
       console.log(`  ATR: ${sample.atr}`)
     }

     process.exit(0)
   }

   verifyIndicators().catch(console.error)
   ```

2. Add to package.json:
   ```json
   "db:verify-indicators": "tsx scripts/verify-indicators.ts"
   ```

3. Run verification:
   ```bash
   npm run db:verify-indicators
   ```

### Expected Output
```
Verifying indicator calculations...

Symbol       | TF  | Total  | BB%  | RSI% | ATR% | Avg RSI | Below BB
------------------------------------------------------------------------------------------
BTCUSDT      | 60  |  17520 | 99.9% | 99.9% | 99.9% |   48.3 | 234
BTCUSDT      | 240 |   4380 | 99.9% | 99.9% | 99.9% |   49.1 | 58
...

Sample candle (latest with indicators):
  Symbol: BTCUSDT
  Time: 2025-01-07T14:00:00.000Z
  Close: 42150.50
  BB: 40200.25 / 41500.00 / 42800.75
  RSI: 34.52
  ATR: 1250.80
```

### Files Created/Modified
- `apps/botbox/scripts/verify-indicators.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Task 3.7: Integrate Indicators into Candle Recorder (15 mins)

### Description
Update the candle recorder to calculate indicators for new candles.

### Steps
1. Update `apps/botbox/src/services/candle-recorder.ts`:
   ```typescript
   import { IndicatorCalculator } from './indicator-calculator'
   import { IndicatorsRepository } from '../db/indicators-repository'

   export class CandleRecorder {
     constructor(
       private db: ReturnType<typeof createDbConnection>,
       private marketData: BybitMarketDataService,
       private candlesRepo: CandlesRepository,
       private indicatorCalculator: IndicatorCalculator,
       private indicatorsRepo: IndicatorsRepository
     ) {}

     async recordLatestCandles(): Promise<{
       recorded: number
       errors: string[]
     }> {
       // ... existing code ...

       for (const instrument of allInstruments) {
         const timeframes = this.getCandlesToRecord(now)

         for (const tf of timeframes) {
           try {
             const candles = await this.marketData.fetchKlines(
               instrument.symbol,
               tf.interval,
               tf.startTime,
               now,
               1
             )

             if (candles.length > 0) {
               await this.candlesRepo.bulkInsert(instrument.id, candles)

               await this.updateIndicatorsForInstrument(
                 instrument.id,
                 tf.interval
               )

               results.recorded++
               console.log(`✓ Recorded ${instrument.symbol} ${tf.interval} candle with indicators`)
             }
           } catch (error) {
             const errMsg = `${instrument.symbol} ${tf.interval}: ${error.message}`
             results.errors.push(errMsg)
             console.error(`✗ ${errMsg}`)
           }
         }
       }

       return results
     }

     private async updateIndicatorsForInstrument(
       instrumentId: number,
       timeframe: string
     ): Promise<void> {
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
         .limit(50)

       recentCandles.reverse()

       const candleInput = recentCandles.map(c => ({
         timestamp: c.timestamp,
         open: parseFloat(c.open),
         high: parseFloat(c.high),
         low: parseFloat(c.low),
         close: parseFloat(c.close),
         volume: parseFloat(c.volume),
       }))

       const latestIndicators = this.indicatorCalculator.calculateForLatest(candleInput)

       await this.indicatorsRepo.updateIndicators(
         instrumentId,
         timeframe,
         [latestIndicators]
       )
     }

     // ... rest of existing code ...
   }
   ```

2. Update scheduled handler to pass new dependencies

### Expected Output
- Candle recorder now calculates indicators for new candles
- Each recorded candle has BB, RSI, ATR calculated

### Files Created/Modified
- `apps/botbox/src/services/candle-recorder.ts` (modify)

---

## Task 3.8: Test Real-time Indicator Updates (10 mins)

### Description
Verify that new candles get indicators calculated correctly.

### Steps
1. Update `apps/botbox/scripts/test-candle-recording.ts` to include indicator check:
   ```typescript
   // ... existing imports ...
   import { IndicatorCalculator } from '../src/services/indicator-calculator'
   import { IndicatorsRepository } from '../src/db/indicators-repository'

   async function testRecording() {
     const db = createDbConnection(process.env.NEON_URL!)
     const marketData = new BybitMarketDataService(true)
     const candlesRepo = new CandlesRepository(db)
     const calculator = new IndicatorCalculator()
     const indicatorsRepo = new IndicatorsRepository(db)

     const recorder = new CandleRecorder(
       db,
       marketData,
       candlesRepo,
       calculator,
       indicatorsRepo
     )

     console.log('Testing candle recording with indicators...\n')

     const result = await recorder.recordLatestCandles()

     console.log(`\n✓ Test complete`)
     console.log(`Candles recorded: ${result.recorded}`)

     const latestWithIndicators = await db
       .select()
       .from(candles)
       .where(isNotNull(candles.rsi))
       .orderBy(desc(candles.timestamp))
       .limit(3)

     console.log(`\nLatest candles with indicators:`)
     for (const candle of latestWithIndicators) {
       console.log(`  ${candle.symbol} ${candle.timeframe}: RSI=${candle.rsi}, BB=${candle.bbLower}-${candle.bbUpper}`)
     }

     process.exit(0)
   }

   testRecording().catch(console.error)
   ```

2. Run test:
   ```bash
   npm run test:recording
   ```

### Expected Output
```
Testing candle recording with indicators...

✓ Recorded BTCUSDT 60 candle with indicators
✓ Recorded ETHUSDT 60 candle with indicators
...

✓ Test complete
Candles recorded: 10

Latest candles with indicators:
  BTCUSDT 60: RSI=34.52, BB=40200.25-42800.75
  ETHUSDT 60: RSI=56.78, BB=2200.50-2350.80
  SOLUSDT 60: RSI=42.15, BB=95.20-105.80
```

### Files Created/Modified
- `apps/botbox/scripts/test-candle-recording.ts` (modify)

---

## Checkpoint: Phase 3 Complete

### Verification Checklist
- [ ] ta library installed
- [ ] Indicator calculator service created
- [ ] Indicators repository implemented
- [ ] All historical candles have indicators calculated
- [ ] Verification shows 99%+ coverage of indicators
- [ ] Real-time candle recording includes indicator calculation
- [ ] Test shows new candles have indicators

### Database Verification
Run in Neon SQL Editor:
```sql
SELECT
  COUNT(*) as total,
  COUNT(bb_upper) as with_bb,
  COUNT(rsi) as with_rsi,
  COUNT(atr) as with_atr,
  (COUNT(bb_upper)::float / COUNT(*)::float * 100) as bb_coverage_pct
FROM candles
WHERE timestamp > NOW() - INTERVAL '1 month';
```

Expected `bb_coverage_pct`: > 95%

### Next Phase
Proceed to `04-trading-logic.md` - Implement ST-002 Mean Reversion strategy logic
