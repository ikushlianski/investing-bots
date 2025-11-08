# Phase 6: Trade Execution & Position Management

## Overview
Execute approved setups on Bybit testnet, monitor orders, calculate P&L.

**Estimated Time**: 4-6 hours (Week 3, Days 6-7)

---

## Task 6.1: Update Bybit Adapter for Spot Trading (20 mins)

### Description
Ensure Bybit adapter supports spot market orders for testnet.

### Steps
1. Review `packages/core/src/exchanges/bybit-adapter.ts`
2. Verify spot order placement methods exist
3. Add any missing methods for testnet:
   ```typescript
   async placeSpotMarketOrder(
     symbol: string,
     side: 'Buy' | 'Sell',
     quantity: number
   ): Promise<OrderResult> {
     const params = {
       category: 'spot',
       symbol,
       side,
       orderType: 'Market',
       qty: quantity.toString(),
     }

     const response = await this.client.submitOrder(params)

     return {
       orderId: response.result.orderId,
       status: response.result.orderStatus,
       executedQty: response.result.cumExecQty,
       avgPrice: response.result.avgPrice,
     }
   }
   ```

### Expected Output
- Bybit adapter ready for spot trading
- Market orders supported

### Files Created/Modified
- `packages/core/src/exchanges/bybit-adapter.ts` (verify/modify)

---

## Task 6.2: Create Trade Executor Service (30 mins)

### Description
Build service to execute approved setups by placing orders on exchange.

### Steps
1. Create `apps/botbox/src/trading/trade-executor.ts`:
   ```typescript
   import { BybitAdapter } from '@repo/core/exchanges/bybit-adapter'
   import { createDbConnection } from '../db/connection'
   import { trades, orders, setupsV0 } from '../db/schema'
   import { RiskCalculator } from './risk-calculator'
   import { eq } from 'drizzle-orm'

   export interface TradeExecutionResult {
     tradeId: number
     orderIds: string[]
     success: boolean
     error?: string
   }

   export class TradeExecutor {
     constructor(
       private db: ReturnType<typeof createDbConnection>,
       private exchange: BybitAdapter,
       private riskCalculator: RiskCalculator
     ) {}

     async executeSetup(setupId: number): Promise<TradeExecutionResult> {
       const setup = await this.db
         .select()
         .from(setupsV0)
         .where(eq(setupsV0.id, setupId))
         .limit(1)

       if (setup.length === 0) {
         throw new Error(`Setup ${setupId} not found`)
       }

       const setupData = setup[0]

       if (setupData.status !== 'APPROVED') {
         throw new Error(`Setup ${setupId} is not approved (status: ${setupData.status})`)
       }

       const entry = parseFloat(setupData.entryPrice)
       const sl = parseFloat(setupData.stopLoss)

       const openPositions = await this.db
         .select()
         .from(trades)
         .where(eq(trades.status, 'OPEN'))

       const sizing = this.riskCalculator.calculatePositionSize(
         entry,
         sl,
         openPositions.length
       )

       if (!sizing.isValid) {
         throw new Error(`Risk validation failed: ${sizing.errors.join(', ')}`)
       }

       const symbol = setupData.symbol
       const isLong = entry < parseFloat(setupData.takeProfit1)
       const side = isLong ? 'Buy' : 'Sell'

       try {
         console.log(`[TradeExecutor] Placing entry order: ${symbol} ${side} ${sizing.positionSize}`)

         const entryOrder = await this.exchange.placeSpotMarketOrder(
           symbol,
           side,
           sizing.positionSize
         )

         const [trade] = await this.db
           .insert(trades)
           .values({
             setupId,
             instrumentId: setupData.instrumentId,
             direction: isLong ? 'long' : 'short',
             entryPrice: entry.toString(),
             stopLoss: sl.toString(),
             takeProfit: parseFloat(setupData.takeProfit1).toString(),
             positionSize: sizing.positionSize.toString(),
             status: 'OPEN',
             entryTime: new Date(),
           })
           .returning({ id: trades.id })

         await this.db.insert(orders).values({
           tradeId: trade.id,
           orderType: 'MARKET',
           side: side.toLowerCase(),
           price: entry.toString(),
           quantity: sizing.positionSize.toString(),
           status: 'FILLED',
           exchangeOrderId: entryOrder.orderId,
           filledAt: new Date(),
         })

         console.log(`[TradeExecutor] Entry order placed: ${entryOrder.orderId}`)

         await this.db
           .update(setupsV0)
           .set({ status: 'TRIGGERED' })
           .where(eq(setupsV0.id, setupId))

         return {
           tradeId: trade.id,
           orderIds: [entryOrder.orderId],
           success: true,
         }
       } catch (error) {
         console.error(`[TradeExecutor] Failed to execute setup ${setupId}:`, error)

         return {
           tradeId: 0,
           orderIds: [],
           success: false,
           error: error.message,
         }
       }
     }
   }
   ```

### Expected Output
- Trade executor service created
- Places market entry orders
- Records trade and order in database

### Files Created/Modified
- `apps/botbox/src/trading/trade-executor.ts` (create)

---

## Task 6.3: Update Approval Endpoint to Trigger Execution (15 mins)

### Description
Modify approval API to execute trade when approved.

### Steps
1. Update `apps/botbox/src/routes/api/setups/$id/approve.ts`:
   ```typescript
   import { TradeExecutor } from '../../../trading/trade-executor'
   import { BybitAdapter } from '@repo/core/exchanges/bybit-adapter'
   import { RiskCalculator } from '../../../trading/risk-calculator'

   export const APIRoute = createAPIFileRoute('/api/setups/$id/approve')({
     POST: async ({ request, params }) => {
       const { id } = params
       const setupId = parseInt(id)

       const db = createDbFromEnv(process.env)
       const setupsRepo = new SetupsRepository(db)

       await setupsRepo.approveSetup(setupId)

       const bybit = new BybitAdapter({
         apiKey: process.env.BYBIT_API_KEY!,
         apiSecret: process.env.BYBIT_API_SECRET!,
         testnet: process.env.BYBIT_TESTNET === 'true',
       })

       const riskCalc = new RiskCalculator({
         accountBalance: 10000,
         riskPerTradePercent: 1,
         maxPositionSizePercent: 10,
         maxOpenPositions: 8,
       })

       const executor = new TradeExecutor(db, bybit, riskCalc)

       try {
         const result = await executor.executeSetup(setupId)

         return json({
           success: result.success,
           setupId,
           tradeId: result.tradeId,
           orderIds: result.orderIds,
           error: result.error,
         })
       } catch (error) {
         return json({
           success: false,
           setupId,
           error: error.message,
         }, { status: 500 })
       }
     },
   })
   ```

### Expected Output
- Approving setup triggers trade execution
- Returns trade ID and order IDs

### Files Created/Modified
- `apps/botbox/src/routes/api/setups/$id/approve.ts` (modify)

---

## Task 6.4: Create Order Monitor Service (25 mins)

### Description
Build service to check order status and update trades.

### Steps
1. Create `apps/botbox/src/trading/order-monitor.ts`:
   ```typescript
   import { BybitAdapter } from '@repo/core/exchanges/bybit-adapter'
   import { createDbConnection } from '../db/connection'
   import { trades, orders } from '../db/schema'
   import { eq } from 'drizzle-orm'

   export class OrderMonitor {
     constructor(
       private db: ReturnType<typeof createDbConnection>,
       private exchange: BybitAdapter
     ) {}

     async monitorOpenTrades(): Promise<{
       checked: number
       closed: number
       errors: string[]
     }> {
       const openTrades = await this.db
         .select()
         .from(trades)
         .where(eq(trades.status, 'OPEN'))

       const results = { checked: 0, closed: 0, errors: [] }

       for (const trade of openTrades) {
         try {
           results.checked++

           const tradeOrders = await this.db
             .select()
             .from(orders)
             .where(eq(orders.tradeId, trade.id))

           const currentPrice = await this.exchange.getCurrentPrice(trade.symbol)

           const entryPrice = parseFloat(trade.entryPrice)
           const stopLoss = parseFloat(trade.stopLoss)
           const takeProfit = parseFloat(trade.takeProfit)

           const isLong = trade.direction === 'long'

           let shouldClose = false
           let closeReason = ''

           if (isLong) {
             if (currentPrice <= stopLoss) {
               shouldClose = true
               closeReason = 'Stop loss hit'
             } else if (currentPrice >= takeProfit) {
               shouldClose = true
               closeReason = 'Take profit hit'
             }
           } else {
             if (currentPrice >= stopLoss) {
               shouldClose = true
               closeReason = 'Stop loss hit'
             } else if (currentPrice <= takeProfit) {
               shouldClose = true
               closeReason = 'Take profit hit'
             }
           }

           if (shouldClose) {
             await this.closeTrade(trade, currentPrice, closeReason)
             results.closed++
           }
         } catch (error) {
           const errMsg = `Trade ${trade.id}: ${error.message}`
           results.errors.push(errMsg)
           console.error(`[OrderMonitor] ${errMsg}`)
         }
       }

       return results
     }

     private async closeTrade(
       trade: any,
       closePrice: number,
       reason: string
     ): Promise<void> {
       const exitSide = trade.direction === 'long' ? 'Sell' : 'Buy'

       const exitOrder = await this.exchange.placeSpotMarketOrder(
         trade.symbol,
         exitSide,
         parseFloat(trade.positionSize)
       )

       const entryPrice = parseFloat(trade.entryPrice)
       const pnl = trade.direction === 'long'
         ? (closePrice - entryPrice) * parseFloat(trade.positionSize)
         : (entryPrice - closePrice) * parseFloat(trade.positionSize)

       const pnlPercent = (pnl / (entryPrice * parseFloat(trade.positionSize))) * 100

       await this.db
         .update(trades)
         .set({
           status: 'CLOSED',
           exitPrice: closePrice.toString(),
           exitTime: new Date(),
           pnl: pnl.toString(),
           pnlPercentage: pnlPercent.toString(),
           closeReason: reason,
         })
         .where(eq(trades.id, trade.id))

       await this.db.insert(orders).values({
         tradeId: trade.id,
         orderType: 'MARKET',
         side: exitSide.toLowerCase(),
         price: closePrice.toString(),
         quantity: trade.positionSize,
         status: 'FILLED',
         exchangeOrderId: exitOrder.orderId,
         filledAt: new Date(),
       })

       console.log(`[OrderMonitor] Closed trade ${trade.id}: ${reason}, P&L: $${pnl.toFixed(2)}`)
     }
   }
   ```

### Expected Output
- Order monitor service created
- Checks open trades against SL/TP
- Closes trades when targets hit

### Files Created/Modified
- `apps/botbox/src/trading/order-monitor.ts` (create)

---

## Task 6.5: Add Order Monitoring to Scheduled Job (15 mins)

### Description
Integrate order monitoring into the cron job.

### Steps
1. Update `apps/botbox/src/scheduled.ts`:
   ```typescript
   import { OrderMonitor } from './trading/order-monitor'
   import { BybitAdapter } from '@repo/core/exchanges/bybit-adapter'

   export async function scheduled(
     event: ScheduledEvent,
     env: Env,
     ctx: ExecutionContext
   ): Promise<void> {
     const db = createDbFromEnv(env)

     console.log(`[Cron] Starting scheduled job at ${new Date().toISOString()}`)

     const marketData = new BybitMarketDataService(env.BYBIT_TESTNET === 'true')
     const candlesRepo = new CandlesRepository(db)
     const indicatorCalc = new IndicatorCalculator()
     const indicatorsRepo = new IndicatorsRepository(db)

     const recorder = new CandleRecorder(
       db,
       marketData,
       candlesRepo,
       indicatorCalc,
       indicatorsRepo
     )

     console.log('[Cron] Recording new candles...')
     const recordResult = await recorder.recordLatestCandles()
     console.log(`[Cron] Recorded ${recordResult.recorded} candles`)

     console.log('[Cron] Running trading loop...')
     const tradingLoop = new TradingLoop(db)
     const loopResult = await tradingLoop.run()
     console.log(`[Cron] Detected ${loopResult.setupsDetected} setups`)

     const bybit = new BybitAdapter({
       apiKey: env.BYBIT_API_KEY,
       apiSecret: env.BYBIT_API_SECRET,
       testnet: env.BYBIT_TESTNET === 'true',
     })

     console.log('[Cron] Monitoring open trades...')
     const orderMonitor = new OrderMonitor(db, bybit)
     const monitorResult = await orderMonitor.monitorOpenTrades()
     console.log(`[Cron] Checked ${monitorResult.checked} trades, closed ${monitorResult.closed}`)

     console.log('[Cron] Scheduled job complete')
   }
   ```

### Expected Output
- Cron job now includes order monitoring
- Runs every 5 minutes

### Files Created/Modified
- `apps/botbox/src/scheduled.ts` (modify)

---

## Task 6.6: Create Trades Dashboard API (20 mins)

### Description
Build API endpoint to view active and closed trades.

### Steps
1. Create `apps/botbox/src/routes/api/trades/index.ts`:
   ```typescript
   import { json } from '@tanstack/react-router'
   import { createAPIFileRoute } from '@tanstack/react-start/api'
   import { createDbFromEnv } from '../../../db/connection'
   import { trades, instruments } from '../../../db/schema'
   import { eq, desc } from 'drizzle-orm'

   export const APIRoute = createAPIFileRoute('/api/trades')({
     GET: async ({ request, params }) => {
       const url = new URL(request.url)
       const status = url.searchParams.get('status') || 'all'

       const db = createDbFromEnv(process.env)

       let query = db
         .select({
           trade: trades,
           instrument: instruments,
         })
         .from(trades)
         .innerJoin(instruments, eq(trades.instrumentId, instruments.id))
         .orderBy(desc(trades.entryTime))

       if (status !== 'all') {
         query = query.where(eq(trades.status, status.toUpperCase()))
       }

       const result = await query

       const tradesData = result.map(({ trade, instrument }) => ({
         ...trade,
         symbol: instrument.symbol,
       }))

       return json(tradesData)
     },
   })
   ```

### Expected Output
- Trades API endpoint created
- Returns active and closed trades

### Files Created/Modified
- `apps/botbox/src/routes/api/trades/index.ts` (create)

---

## Task 6.7: Test Trade Execution Flow (20 mins)

### Description
Create script to test full execution flow end-to-end.

### Steps
1. Create `apps/botbox/scripts/test-trade-execution.ts`:
   ```typescript
   import { config } from 'dotenv'
   import { createDbConnection } from '../src/db/connection'
   import { BybitAdapter } from '@repo/core/exchanges/bybit-adapter'
   import { TradeExecutor } from '../src/trading/trade-executor'
   import { RiskCalculator } from '../src/trading/risk-calculator'
   import { SetupsRepository } from '../src/db/setups-repository'

   config({ path: '.dev.vars' })

   async function testExecution() {
     const db = createDbConnection(process.env.DATABASE_URL!)
     const setupsRepo = new SetupsRepository(db)

     console.log('Testing trade execution flow...\n')

     const activeSetups = await setupsRepo.getActiveSetups()

     if (activeSetups.length === 0) {
       console.log('No active setups to test. Run trading loop first.')
       process.exit(0)
     }

     const setup = activeSetups[0]
     console.log(`Testing with setup ${setup.id}: ${setup.symbol} ${setup.setupType}`)

     await setupsRepo.approveSetup(setup.id)
     console.log('✓ Setup approved')

     const bybit = new BybitAdapter({
       apiKey: process.env.BYBIT_API_KEY!,
       apiSecret: process.env.BYBIT_API_SECRET!,
       testnet: process.env.BYBIT_TESTNET === 'true',
     })

     const riskCalc = new RiskCalculator({
       accountBalance: 10000,
       riskPerTradePercent: 1,
       maxPositionSizePercent: 10,
       maxOpenPositions: 8,
     })

     const executor = new TradeExecutor(db, bybit, riskCalc)

     console.log('Executing trade...')
     const result = await executor.executeSetup(setup.id)

     if (result.success) {
       console.log(`✓ Trade executed successfully`)
       console.log(`  Trade ID: ${result.tradeId}`)
       console.log(`  Order IDs: ${result.orderIds.join(', ')}`)
     } else {
       console.log(`✗ Trade execution failed: ${result.error}`)
     }

     process.exit(0)
   }

   testExecution().catch(error => {
     console.error('Test failed:', error)
     process.exit(1)
   })
   ```

2. Add to package.json:
   ```json
   "test:execution": "tsx scripts/test-trade-execution.ts"
   ```

### Expected Output
```
Testing trade execution flow...

Testing with setup 1: SOLUSDT LOWER_BB_BOUNCE
✓ Setup approved
Executing trade...
[TradeExecutor] Placing entry order: SOLUSDT Buy 0.9756
[TradeExecutor] Entry order placed: 1234567890
✓ Trade executed successfully
  Trade ID: 1
  Order IDs: 1234567890
```

### Files Created/Modified
- `apps/botbox/scripts/test-trade-execution.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Checkpoint: Phase 6 Complete

### Verification Checklist
- [ ] Bybit adapter supports spot trading
- [ ] Trade executor service created
- [ ] Approval triggers trade execution
- [ ] Order monitor checks SL/TP
- [ ] Cron job includes order monitoring
- [ ] Trades API endpoint works
- [ ] Test execution flow passes

### Test Full Flow
1. Run trading loop: `npm run test:trading`
2. Approve setup in dashboard
3. Check trade executed on Bybit testnet
4. Wait for SL/TP to be hit (or manually close)

### Next Phase
Proceed to `07-deployment.md` - Deploy to Cloudflare Workers and run live test
