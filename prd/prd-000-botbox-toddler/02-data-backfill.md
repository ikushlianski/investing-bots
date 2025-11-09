# Phase 2: Historical Data Backfill

## Overview
Fetch and store 2 years of historical candle data for all 10 instruments across 4 timeframes.

**Estimated Time**: 3-4 hours (Week 1, Days 3-4)

**Data Volume**:
- 10 pairs × 4 timeframes (1H, 4H, 1D, 1W)
- ~227,000 total candles
- ~100 MB storage

---

## Task 2.1: Install Bybit SDK (5 mins)

### Description
Install the official Bybit SDK for fetching historical data.

### Steps
1. Install dependencies:
   ```bash
   cd apps/botbox
   npm install bybit-api
   npm install --save-dev @types/node
   ```

### Expected Output
- Bybit SDK installed
- Ready to fetch market data

### Files Created/Modified
- `apps/botbox/package.json` (dependencies)

---

## Task 2.2: Create Bybit Market Data Fetcher (20 mins)

### Description
Build a module to fetch historical kline/candle data from Bybit.

### Steps
1. Create `apps/botbox/src/services/bybit-market-data.ts`:
   ```typescript
   import { RestClientV5 } from 'bybit-api'

   export interface BybitCandle {
     symbol: string
     timeframe: string
     timestamp: number
     open: string
     high: string
     low: string
     close: string
     volume: string
   }

   export class BybitMarketDataService {
     private client: RestClientV5

     constructor(isTestnet: boolean = true) {
       this.client = new RestClientV5({
         testnet: isTestnet,
       })
     }

     async fetchKlines(
       symbol: string,
       interval: string,
       startTime: number,
       endTime: number,
       limit: number = 1000
     ): Promise<BybitCandle[]> {
       try {
         const response = await this.client.getKline({
           category: 'spot',
           symbol,
           interval,
           start: startTime,
           end: endTime,
           limit,
         })

         if (response.retCode !== 0) {
           throw new Error(`Bybit API error: ${response.retMsg}`)
         }

         return response.result.list.map((candle: any) => ({
           symbol,
           timeframe: interval,
           timestamp: parseInt(candle[0]),
           open: candle[1],
           high: candle[2],
           low: candle[3],
           close: candle[4],
           volume: candle[5],
         }))
       } catch (error) {
         console.error(`Error fetching klines for ${symbol}:`, error)
         throw error
       }
     }

     async fetchAllKlines(
       symbol: string,
       interval: string,
       startTime: number,
       endTime: number
     ): Promise<BybitCandle[]> {
       const allCandles: BybitCandle[] = []
       let currentStart = startTime

       while (currentStart < endTime) {
         const candles = await this.fetchKlines(
           symbol,
           interval,
           currentStart,
           endTime,
           1000
         )

         if (candles.length === 0) break

         allCandles.push(...candles)

         const lastTimestamp = candles[candles.length - 1].timestamp
         currentStart = lastTimestamp + 1

         await this.sleep(100)
       }

       return allCandles
     }

     private sleep(ms: number): Promise<void> {
       return new Promise(resolve => setTimeout(resolve, ms))
     }

     static getIntervalMillis(interval: string): number {
       const map: Record<string, number> = {
         '60': 60 * 60 * 1000,
         '240': 4 * 60 * 60 * 1000,
         'D': 24 * 60 * 60 * 1000,
         'W': 7 * 24 * 60 * 60 * 1000,
       }
       return map[interval] || 0
     }
   }
   ```

### Expected Output
- Market data service created
- Pagination and rate limiting handled

### Files Created/Modified
- `apps/botbox/src/services/bybit-market-data.ts` (create)

---

## Task 2.3: Create Candle Persistence Module (15 mins)

### Description
Build database functions to bulk insert candles efficiently.

### Steps
1. Create `apps/botbox/src/db/candles-repository.ts`:
   ```typescript
   import { createDbConnection } from './connection'
   import { candles } from './schema'
   import { BybitCandle } from '../services/bybit-market-data'

   export class CandlesRepository {
     constructor(private db: ReturnType<typeof createDbConnection>) {}

     async bulkInsert(
       instrumentId: number,
       candleData: BybitCandle[]
     ): Promise<void> {
       if (candleData.length === 0) return

       const values = candleData.map(candle => ({
         instrumentId,
         timeframe: candle.timeframe,
         timestamp: new Date(candle.timestamp),
         open: candle.open,
         high: candle.high,
         low: candle.low,
         close: candle.close,
         volume: candle.volume,
       }))

       await this.db.insert(candles).values(values).onConflictDoNothing()
     }

     async getCandleCount(
       instrumentId: number,
       timeframe: string
     ): Promise<number> {
       const result = await this.db
         .select({ count: sql<number>`count(*)` })
         .from(candles)
         .where(
           and(
             eq(candles.instrumentId, instrumentId),
             eq(candles.timeframe, timeframe)
           )
         )

       return result[0]?.count || 0
     }

     async getDateRange(
       instrumentId: number,
       timeframe: string
     ): Promise<{ min: Date; max: Date } | null> {
       const result = await this.db
         .select({
           min: sql<Date>`min(timestamp)`,
           max: sql<Date>`max(timestamp)`,
         })
         .from(candles)
         .where(
           and(
             eq(candles.instrumentId, instrumentId),
             eq(candles.timeframe, timeframe)
           )
         )

       return result[0] || null
     }
   }
   ```

### Expected Output
- Repository for candle operations created
- Efficient bulk insert with conflict handling

### Files Created/Modified
- `apps/botbox/src/db/candles-repository.ts` (create)

---

## Task 2.4: Build Backfill Orchestrator Script (25 mins)

### Description
Create the main backfill script that coordinates fetching and storing all historical data.

### Steps
1. Create `apps/botbox/scripts/backfill-candles.ts`:
   ```typescript
   import { config } from 'dotenv'
   import { createDbConnection } from '../src/db/connection'
   import { instruments } from '../src/db/schema'
   import { BybitMarketDataService } from '../src/services/bybit-market-data'
   import { CandlesRepository } from '../src/db/candles-repository'

   config({ path: '.dev.vars' })

   const TIMEFRAMES = ['60', '240', 'D', 'W']
   const YEARS_TO_BACKFILL = 2

   async function backfillCandles() {
    const db = createDbConnection(process.env.NEON_URL!)
     const marketData = new BybitMarketDataService(true)
     const candlesRepo = new CandlesRepository(db)

     const allInstruments = await db.select().from(instruments).where(eq(instruments.isActive, true))

     console.log(`Starting backfill for ${allInstruments.length} instruments...`)
     console.log(`Timeframes: ${TIMEFRAMES.join(', ')}`)
     console.log(`Period: ${YEARS_TO_BACKFILL} years\n`)

     const endTime = Date.now()
     const startTime = endTime - (YEARS_TO_BACKFILL * 365 * 24 * 60 * 60 * 1000)

     let totalCandles = 0

     for (const instrument of allInstruments) {
       console.log(`\n[${ instrument.symbol}] Starting backfill...`)

       for (const timeframe of TIMEFRAMES) {
         const startTimestamp = Date.now()

         try {
           console.log(`  [${timeframe}] Fetching from Bybit...`)

           const candles = await marketData.fetchAllKlines(
             instrument.symbol,
             timeframe,
             startTime,
             endTime
           )

           console.log(`  [${timeframe}] Fetched ${candles.length} candles`)

           await candlesRepo.bulkInsert(instrument.id, candles)

           const elapsed = ((Date.now() - startTimestamp) / 1000).toFixed(1)
           console.log(`  [${timeframe}] ✓ Saved to database (${elapsed}s)`)

           totalCandles += candles.length
         } catch (error) {
           console.error(`  [${timeframe}] ✗ Error:`, error.message)
         }
       }

       const range = await candlesRepo.getDateRange(instrument.id, '60')
       if (range) {
         console.log(`  ✓ Date range: ${range.min.toISOString()} to ${range.max.toISOString()}`)
       }
     }

     console.log(`\n✓ Backfill complete!`)
     console.log(`Total candles stored: ${totalCandles.toLocaleString()}`)
     process.exit(0)
   }

   backfillCandles().catch(error => {
     console.error('Backfill failed:', error)
     process.exit(1)
   })
   ```

2. Add script to package.json:
   ```json
   "db:backfill": "tsx scripts/backfill-candles.ts"
   ```

### Expected Output
- Backfill orchestrator ready to run
- Progress logging for each instrument/timeframe

### Files Created/Modified
- `apps/botbox/scripts/backfill-candles.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Task 2.5: Run Backfill Script (30-45 mins execution time)

### Description
Execute the backfill to populate the database with 2 years of historical data.

### Steps
1. Ensure you're on a stable internet connection
2. Run the backfill:
   ```bash
   cd apps/botbox
   npm run db:backfill
   ```

3. Monitor progress in terminal
4. Script will take 15-30 minutes depending on network speed

### Expected Output
```
Starting backfill for 10 instruments...
Timeframes: 60, 240, D, W
Period: 2 years

[BTCUSDT] Starting backfill...
  [60] Fetching from Bybit...
  [60] Fetched 17520 candles
  [60] ✓ Saved to database (45.2s)
  [240] Fetching from Bybit...
  [240] Fetched 4380 candles
  [240] ✓ Saved to database (12.1s)
  ...

✓ Backfill complete!
Total candles stored: 227,340
```

### Files Created/Modified
None (data operation)

---

## Task 2.6: Create Data Verification Script (15 mins)

### Description
Build a script to verify data quality and completeness.

### Steps
1. Create `apps/botbox/scripts/verify-candles.ts`:
   ```typescript
   import { config } from 'dotenv'
   import { createDbConnection } from '../src/db/connection'
   import { candles, instruments } from '../src/db/schema'
   import { sql } from 'drizzle-orm'

   config({ path: '.dev.vars' })

   async function verifyCandles() {
    const db = createDbConnection(process.env.NEON_URL!)

     console.log('Verifying candle data...\n')

     const stats = await db.execute(sql`
       SELECT
         i.symbol,
         c.timeframe,
         COUNT(*) as candle_count,
         MIN(c.timestamp) as earliest,
         MAX(c.timestamp) as latest,
         COUNT(CASE WHEN c.open IS NULL THEN 1 END) as null_opens,
         COUNT(CASE WHEN c.high < c.low THEN 1 END) as invalid_highs
       FROM candles c
       JOIN instruments i ON c.instrument_id = i.id
       GROUP BY i.symbol, c.timeframe
       ORDER BY i.symbol, c.timeframe
     `)

     console.log('Symbol       | TF  | Count  | Earliest            | Latest              | Issues')
     console.log('-'.repeat(95))

     for (const row of stats.rows) {
       const issues = (row.null_opens || 0) + (row.invalid_highs || 0)
       const issueStr = issues > 0 ? `⚠ ${issues}` : '✓'

       console.log(
         `${row.symbol.padEnd(12)} | ${row.timeframe.padEnd(3)} | ` +
         `${row.candle_count.toString().padStart(6)} | ` +
         `${new Date(row.earliest).toISOString().slice(0, 19)} | ` +
         `${new Date(row.latest).toISOString().slice(0, 19)} | ${issueStr}`
       )
     }

     const totalCount = await db.execute(sql`SELECT COUNT(*) as total FROM candles`)
     console.log(`\nTotal candles: ${totalCount.rows[0].total.toLocaleString()}`)

     process.exit(0)
   }

   verifyCandles().catch(console.error)
   ```

2. Add to package.json:
   ```json
   "db:verify": "tsx scripts/verify-candles.ts"
   ```

3. Run verification:
   ```bash
   npm run db:verify
   ```

### Expected Output
```
Verifying candle data...

Symbol       | TF  | Count  | Earliest            | Latest              | Issues
-----------------------------------------------------------------------------------------------
BTCUSDT      | 60  |  17520 | 2023-01-07T14:00:00 | 2025-01-07T14:00:00 | ✓
BTCUSDT      | 240 |   4380 | 2023-01-07T16:00:00 | 2025-01-07T12:00:00 | ✓
...

Total candles: 227,340
```

### Files Created/Modified
- `apps/botbox/scripts/verify-candles.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Task 2.7: Create Candle Recording Cron Infrastructure (20 mins)

### Description
Set up the infrastructure for recording new candles as they close in real-time.

### Steps
1. Create `apps/botbox/src/services/candle-recorder.ts`:
   ```typescript
   import { createDbConnection } from '../db/connection'
   import { BybitMarketDataService } from './bybit-market-data'
   import { CandlesRepository } from '../db/candles-repository'
   import { instruments } from '../db/schema'
   import { eq } from 'drizzle-orm'

   export class CandleRecorder {
     constructor(
       private db: ReturnType<typeof createDbConnection>,
       private marketData: BybitMarketDataService,
       private candlesRepo: CandlesRepository
     ) {}

     async recordLatestCandles(): Promise<{
       recorded: number
       errors: string[]
     }> {
       const allInstruments = await this.db
         .select()
         .from(instruments)
         .where(eq(instruments.isActive, true))

       const now = Date.now()
       const results = { recorded: 0, errors: [] }

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
               results.recorded++
               console.log(`✓ Recorded ${instrument.symbol} ${tf.interval} candle`)
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

     private getCandlesToRecord(timestamp: number): Array<{
       interval: string
       startTime: number
     }> {
       const result: Array<{ interval: string; startTime: number }> = []
       const date = new Date(timestamp)

       const minute = date.getUTCMinutes()
       const hour = date.getUTCHours()
       const day = date.getUTCDay()

       if (minute === 0) {
         result.push({
           interval: '60',
           startTime: timestamp - (60 * 60 * 1000),
         })
       }

       if (minute === 0 && hour % 4 === 0) {
         result.push({
           interval: '240',
           startTime: timestamp - (4 * 60 * 60 * 1000),
         })
       }

       if (minute === 0 && hour === 0) {
         result.push({
           interval: 'D',
           startTime: timestamp - (24 * 60 * 60 * 1000),
         })
       }

       if (minute === 0 && hour === 0 && day === 1) {
         result.push({
           interval: 'W',
           startTime: timestamp - (7 * 24 * 60 * 60 * 1000),
         })
       }

       return result
     }
   }
   ```

### Expected Output
- Candle recording service created
- Logic to determine which timeframes to record based on current time

### Files Created/Modified
- `apps/botbox/src/services/candle-recorder.ts` (create)

---

## Task 2.8: Add Cron Trigger to wrangler.jsonc (10 mins)

### Description
Configure Cloudflare Worker to run every 5 minutes for candle recording.

### Steps
1. Update `apps/botbox/wrangler.jsonc` - add triggers section:
   ```jsonc
   {
     "triggers": {
       "crons": ["*/5 * * * *"]
     }
   }
   ```

2. Create scheduled handler in `apps/botbox/src/scheduled.ts`:
   ```typescript
   import { createDbFromEnv } from './db/connection'
   import { BybitMarketDataService } from './services/bybit-market-data'
   import { CandlesRepository } from './db/candles-repository'
   import { CandleRecorder } from './services/candle-recorder'

   export async function scheduled(
     event: ScheduledEvent,
     env: Env,
     ctx: ExecutionContext
   ): Promise<void> {
     const db = createDbFromEnv(env)
     const marketData = new BybitMarketDataService(env.BYBIT_TESTNET === 'true')
     const candlesRepo = new CandlesRepository(db)
     const recorder = new CandleRecorder(db, marketData, candlesRepo)

     console.log(`[Cron] Starting candle recording at ${new Date().toISOString()}`)

     const result = await recorder.recordLatestCandles()

     console.log(`[Cron] Recorded ${result.recorded} candles`)
     if (result.errors.length > 0) {
       console.error(`[Cron] ${result.errors.length} errors:`, result.errors)
     }
   }
   ```

3. Export scheduled handler from main entry point if needed

### Expected Output
- Cron trigger configured (runs every 5 minutes)
- Scheduled handler created

### Files Created/Modified
- `apps/botbox/wrangler.jsonc` (modify)
- `apps/botbox/src/scheduled.ts` (create)

---

## Task 2.9: Test Candle Recording Locally (15 mins)

### Description
Test the candle recording logic before deploying cron.

### Steps
1. Create `apps/botbox/scripts/test-candle-recording.ts`:
   ```typescript
   import { config } from 'dotenv'
   import { createDbConnection } from '../src/db/connection'
   import { BybitMarketDataService } from '../src/services/bybit-market-data'
   import { CandlesRepository } from '../src/db/candles-repository'
   import { CandleRecorder } from '../src/services/candle-recorder'

   config({ path: '.dev.vars' })

   async function testRecording() {
    const db = createDbConnection(process.env.NEON_URL!)
     const marketData = new BybitMarketDataService(true)
     const candlesRepo = new CandlesRepository(db)
     const recorder = new CandleRecorder(db, marketData, candlesRepo)

     console.log('Testing candle recording...\n')

     const result = await recorder.recordLatestCandles()

     console.log(`\n✓ Test complete`)
     console.log(`Candles recorded: ${result.recorded}`)
     console.log(`Errors: ${result.errors.length}`)

     if (result.errors.length > 0) {
       console.log('Error details:')
       result.errors.forEach(err => console.log(`  - ${err}`))
     }

     process.exit(0)
   }

   testRecording().catch(console.error)
   ```

2. Add to package.json:
   ```json
   "test:recording": "tsx scripts/test-candle-recording.ts"
   ```

3. Run test:
   ```bash
   npm run test:recording
   ```

### Expected Output
```
Testing candle recording...

✓ Recorded BTCUSDT 60 candle
✓ Recorded ETHUSDT 60 candle
...

✓ Test complete
Candles recorded: 10
Errors: 0
```

### Files Created/Modified
- `apps/botbox/scripts/test-candle-recording.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Checkpoint: Phase 2 Complete

### Verification Checklist
- [ ] Bybit SDK installed
- [ ] Market data service created
- [ ] Candles repository implemented
- [ ] Backfill script completed successfully
- [ ] 227,000+ candles stored in database
- [ ] Data verification shows no issues
- [ ] Candle recorder service created
- [ ] Cron trigger configured
- [ ] Recording test passes

### Database Stats
Run this query in Neon SQL Editor to verify:
```sql
SELECT
  COUNT(*) as total_candles,
  COUNT(DISTINCT instrument_id) as instruments,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM candles;
```

Expected:
- `total_candles`: ~227,000
- `instruments`: 10
- `earliest`: ~2 years ago
- `latest`: today

### Next Phase
Proceed to `03-indicator-calculation.md` - Calculate and store trading indicators
