# Phase 5: Approval Dashboard with TradingView Charts

## Overview
Build React UI with TradingView Lightweight Charts for visual setup approval.

**Estimated Time**: 8-10 hours (Week 3, Days 1-5)

---

## Task 5.1: Install TradingView Lightweight Charts (5 mins)

### Description
Install the chart library and types.

### Steps
```bash
cd apps/botbox
npm install lightweight-charts
```

### Expected Output
- Library installed successfully

### Files Created/Modified
- `apps/botbox/package.json` (dependencies)

---

## Task 5.2: Create Pending Setups API Endpoint (20 mins)

### Description
Build API endpoint to fetch active setups with full details.

### Steps
1. Create `apps/botbox/src/routes/api/setups/pending.ts`:
   ```typescript
   import { json } from '@tanstack/react-router'
   import { createAPIFileRoute } from '@tanstack/react-start/api'
   import { createDbFromEnv } from '../../../db/connection'
   import { setupsV0, setupSignalsV0, instruments } from '../../../db/schema'
   import { eq } from 'drizzle-orm'

   export const APIRoute = createAPIFileRoute('/api/setups/pending')({
     GET: async ({ request, params }) => {
       const db = createDbFromEnv(process.env)

       const activeSetups = await db
         .select({
           setup: setupsV0,
           instrument: instruments,
         })
         .from(setupsV0)
         .innerJoin(instruments, eq(setupsV0.instrumentId, instruments.id))
         .where(eq(setupsV0.status, 'ACTIVE'))

       const setupsWithSignals = await Promise.all(
         activeSetups.map(async ({ setup, instrument }) => {
           const signals = await db
             .select()
             .from(setupSignalsV0)
             .where(eq(setupSignalsV0.setupId, setup.id))

           return {
             ...setup,
             symbol: instrument.symbol,
             signals,
             metadata: JSON.parse(setup.metadata || '{}'),
           }
         })
       )

       return json(setupsWithSignals)
     },
   })
   ```

### Expected Output
- API endpoint returns pending setups with signals

### Files Created/Modified
- `apps/botbox/src/routes/api/setups/pending.ts` (create)

---

## Task 5.3: Create Candles Data API Endpoint (20 mins)

### Description
Build endpoint to fetch historical candles for chart display.

### Steps
1. Create `apps/botbox/src/routes/api/candles/$symbol/$timeframe.ts`:
   ```typescript
   import { json } from '@tanstack/react-router'
   import { createAPIFileRoute } from '@tanstack/react-start/api'
   import { createDbFromEnv } from '../../../db/connection'
   import { candles, instruments } from '../../../db/schema'
   import { eq, and, desc } from 'drizzle-orm'

   export const APIRoute = createAPIFileRoute('/api/candles/$symbol/$timeframe')({
     GET: async ({ request, params }) => {
       const { symbol, timeframe } = params
       const url = new URL(request.url)
       const limit = parseInt(url.searchParams.get('limit') || '100')

       const db = createDbFromEnv(process.env)

       const instrument = await db
         .select()
         .from(instruments)
         .where(eq(instruments.symbol, symbol))
         .limit(1)

       if (instrument.length === 0) {
         return json({ error: 'Instrument not found' }, { status: 404 })
       }

       const candleData = await db
         .select()
         .from(candles)
         .where(
           and(
             eq(candles.instrumentId, instrument[0].id),
             eq(candles.timeframe, timeframe)
           )
         )
         .orderBy(desc(candles.timestamp))
         .limit(limit)

       const formattedCandles = candleData.reverse().map(c => ({
         time: Math.floor(c.timestamp.getTime() / 1000),
         open: parseFloat(c.open),
         high: parseFloat(c.high),
         low: parseFloat(c.low),
         close: parseFloat(c.close),
         volume: parseFloat(c.volume),
         bbUpper: c.bbUpper ? parseFloat(c.bbUpper) : null,
         bbMiddle: c.bbMiddle ? parseFloat(c.bbMiddle) : null,
         bbLower: c.bbLower ? parseFloat(c.bbLower) : null,
         rsi: c.rsi ? parseFloat(c.rsi) : null,
         atr: c.atr ? parseFloat(c.atr) : null,
       }))

       return json(formattedCandles)
     },
   })
   ```

### Expected Output
- API returns candles with indicators for charting

### Files Created/Modified
- `apps/botbox/src/routes/api/candles/$symbol/$timeframe.ts` (create)

---

## Task 5.4: Create Setup Approval API Endpoint (15 mins)

### Description
Build endpoint to approve or reject setups.

### Steps
1. Create `apps/botbox/src/routes/api/setups/$id/approve.ts`:
   ```typescript
   import { json } from '@tanstack/react-router'
   import { createAPIFileRoute } from '@tanstack/react-start/api'
   import { createDbFromEnv } from '../../../db/connection'
   import { SetupsRepository } from '../../../db/setups-repository'

   export const APIRoute = createAPIFileRoute('/api/setups/$id/approve')({
     POST: async ({ request, params }) => {
       const { id } = params
       const setupId = parseInt(id)

       const db = createDbFromEnv(process.env)
       const setupsRepo = new SetupsRepository(db)

       await setupsRepo.approveSetup(setupId)

       return json({ success: true, setupId })
     },
   })
   ```

2. Create `apps/botbox/src/routes/api/setups/$id/reject.ts`:
   ```typescript
   import { json } from '@tanstack/react-router'
   import { createAPIFileRoute } from '@tanstack/react-start/api'
   import { createDbFromEnv } from '../../../db/connection'
   import { SetupsRepository } from '../../../db/setups-repository'

   export const APIRoute = createAPIFileRoute('/api/setups/$id/reject')({
     POST: async ({ request, params }) => {
       const { id } = params
       const setupId = parseInt(id)

       const db = createDbFromEnv(process.env)
       const setupsRepo = new SetupsRepository(db)

       await setupsRepo.invalidateSetup(setupId, 'Manually rejected by user')

       return json({ success: true, setupId })
     },
   })
   ```

### Expected Output
- Approve/reject endpoints created

### Files Created/Modified
- `apps/botbox/src/routes/api/setups/$id/approve.ts` (create)
- `apps/botbox/src/routes/api/setups/$id/reject.ts` (create)

---

## Task 5.5: Create TradingView Chart Component (30 mins)

### Description
Build reusable chart component using Lightweight Charts.

### Steps
1. Create `apps/botbox/src/components/trading-chart.tsx`:
   ```typescript
   import { useEffect, useRef } from 'react'
   import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts'

   interface TradingChartProps {
     symbol: string
     timeframe: string
     setupDetails?: {
       entryPrice: number
       stopLoss: number
       takeProfit1: number
       takeProfit2: number
       detectedAt: string
     }
   }

   export function TradingChart({ symbol, timeframe, setupDetails }: TradingChartProps) {
     const chartContainerRef = useRef<HTMLDivElement>(null)
     const chartRef = useRef<IChartApi | null>(null)

     useEffect(() => {
       if (!chartContainerRef.current) return

       const chart = createChart(chartContainerRef.current, {
         layout: {
           background: { color: '#1a1a1a' },
           textColor: '#d1d4dc',
         },
         grid: {
           vertLines: { color: '#2a2a2a' },
           horzLines: { color: '#2a2a2a' },
         },
         width: chartContainerRef.current.clientWidth,
         height: 500,
       })

       chartRef.current = chart

       const candleSeries = chart.addCandlestickSeries({
         upColor: '#26a69a',
         downColor: '#ef5350',
         borderVisible: false,
         wickUpColor: '#26a69a',
         wickDownColor: '#ef5350',
       })

       fetchAndDisplayData(chart, candleSeries)

       const handleResize = () => {
         if (chartContainerRef.current && chartRef.current) {
           chartRef.current.applyOptions({
             width: chartContainerRef.current.clientWidth,
           })
         }
       }

       window.addEventListener('resize', handleResize)

       return () => {
         window.removeEventListener('resize', handleResize)
         chart.remove()
       }
     }, [symbol, timeframe])

     useEffect(() => {
       if (chartRef.current && setupDetails) {
         addSetupMarkers()
       }
     }, [setupDetails])

     async function fetchAndDisplayData(
       chart: IChartApi,
       candleSeries: ISeriesApi<'Candlestick'>
     ) {
       try {
         const response = await fetch(`/api/candles/${symbol}/${timeframe}?limit=200`)
         const data = await response.json()

         candleSeries.setData(data)

         const bbUpper = data
           .filter((d: any) => d.bbUpper !== null)
           .map((d: any) => ({ time: d.time, value: d.bbUpper }))

         const bbMiddle = data
           .filter((d: any) => d.bbMiddle !== null)
           .map((d: any) => ({ time: d.time, value: d.bbMiddle }))

         const bbLower = data
           .filter((d: any) => d.bbLower !== null)
           .map((d: any) => ({ time: d.time, value: d.bbLower }))

         if (bbUpper.length > 0) {
           const upperLine = chart.addLineSeries({
             color: '#2962FF',
             lineWidth: 1,
             title: 'BB Upper',
           })
           upperLine.setData(bbUpper)

           const middleLine = chart.addLineSeries({
             color: '#FFB74D',
             lineWidth: 1,
             title: 'BB Middle',
           })
           middleLine.setData(bbMiddle)

           const lowerLine = chart.addLineSeries({
             color: '#2962FF',
             lineWidth: 1,
             title: 'BB Lower',
           })
           lowerLine.setData(bbLower)
         }
       } catch (error) {
         console.error('Failed to fetch candle data:', error)
       }
     }

     function addSetupMarkers() {
       if (!chartRef.current || !setupDetails) return

       const entryLine = chartRef.current.addLineSeries({
         color: '#4CAF50',
         lineWidth: 2,
         lineStyle: 0,
         title: 'Entry',
       })

       const slLine = chartRef.current.addLineSeries({
         color: '#F44336',
         lineWidth: 2,
         lineStyle: 2,
         title: 'Stop Loss',
       })

       const tp1Line = chartRef.current.addLineSeries({
         color: '#2196F3',
         lineWidth: 1,
         lineStyle: 2,
         title: 'TP1',
       })

       const tp2Line = chartRef.current.addLineSeries({
         color: '#2196F3',
         lineWidth: 1,
         lineStyle: 2,
         title: 'TP2',
       })

       const detectedTime = Math.floor(new Date(setupDetails.detectedAt).getTime() / 1000)
       const futureTime = detectedTime + (24 * 60 * 60)

       entryLine.setData([
         { time: detectedTime, value: setupDetails.entryPrice },
         { time: futureTime, value: setupDetails.entryPrice },
       ])

       slLine.setData([
         { time: detectedTime, value: setupDetails.stopLoss },
         { time: futureTime, value: setupDetails.stopLoss },
       ])

       tp1Line.setData([
         { time: detectedTime, value: setupDetails.takeProfit1 },
         { time: futureTime, value: setupDetails.takeProfit1 },
       ])

       tp2Line.setData([
         { time: detectedTime, value: setupDetails.takeProfit2 },
         { time: futureTime, value: setupDetails.takeProfit2 },
       ])
     }

     return (
       <div className="trading-chart-container">
         <div ref={chartContainerRef} />
       </div>
     )
   }
   ```

### Expected Output
- Reusable chart component created
- Displays candles, Bollinger Bands, entry/SL/TP lines

### Files Created/Modified
- `apps/botbox/src/components/trading-chart.tsx` (create)

---

## Task 5.6: Create Setup Details Card Component (20 mins)

### Description
Build component to display setup signals and risk calculations.

### Steps
1. Create `apps/botbox/src/components/setup-details-card.tsx`:
   ```typescript
   interface SetupDetailsCardProps {
     setup: {
       id: number
       symbol: string
       setupType: string
       entryPrice: string
       stopLoss: string
       takeProfit1: string
       takeProfit2: string
       detectedAt: Date
       signals: Array<{ signalType: string; value: string }>
       metadata: any
     }
     onApprove: (id: number) => void
     onReject: (id: number) => void
   }

   export function SetupDetailsCard({ setup, onApprove, onReject }: SetupDetailsCardProps) {
     const entry = parseFloat(setup.entryPrice)
     const sl = parseFloat(setup.stopLoss)
     const stopDistance = Math.abs(entry - sl)
     const stopDistancePct = ((stopDistance / entry) * 100).toFixed(2)

     const accountBalance = 10000
     const riskAmount = accountBalance * 0.01
     const positionSize = riskAmount / stopDistance

     return (
       <div className="setup-card border border-gray-700 rounded-lg p-6 bg-gray-800">
         <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="text-xl font-bold text-white">
               {setup.symbol} {setup.setupType.replace('_', ' ')}
             </h3>
             <p className="text-sm text-gray-400">
               Detected: {new Date(setup.detectedAt).toLocaleString()}
             </p>
           </div>
           <span className="px-3 py-1 bg-yellow-900 text-yellow-200 rounded-full text-sm">
             Pending Approval
           </span>
         </div>

         <div className="grid grid-cols-2 gap-4 mb-4">
           <div>
             <p className="text-sm text-gray-400">Entry Price</p>
             <p className="text-lg font-bold text-green-400">${entry.toFixed(2)}</p>
           </div>
           <div>
             <p className="text-sm text-gray-400">Stop Loss</p>
             <p className="text-lg font-bold text-red-400">${sl.toFixed(2)}</p>
           </div>
           <div>
             <p className="text-sm text-gray-400">Take Profit 1 (70%)</p>
             <p className="text-lg font-bold text-blue-400">
               ${parseFloat(setup.takeProfit1).toFixed(2)}
             </p>
           </div>
           <div>
             <p className="text-sm text-gray-400">Take Profit 2 (30%)</p>
             <p className="text-lg font-bold text-blue-400">
               ${parseFloat(setup.takeProfit2).toFixed(2)}
             </p>
           </div>
         </div>

         <div className="mb-4 p-4 bg-gray-900 rounded">
           <h4 className="text-sm font-bold text-white mb-2">Risk Calculation</h4>
           <div className="grid grid-cols-3 gap-2 text-sm">
             <div>
               <p className="text-gray-400">Stop Distance</p>
               <p className="text-white">{stopDistancePct}%</p>
             </div>
             <div>
               <p className="text-gray-400">Risk Amount</p>
               <p className="text-white">${riskAmount.toFixed(2)} (1%)</p>
             </div>
             <div>
               <p className="text-gray-400">Position Size</p>
               <p className="text-white">{positionSize.toFixed(4)} {setup.symbol.replace('USDT', '')}</p>
             </div>
           </div>
         </div>

         <div className="mb-4">
           <h4 className="text-sm font-bold text-white mb-2">Signals Detected</h4>
           <div className="space-y-1">
             {setup.signals.map((signal, idx) => (
               <div key={idx} className="flex items-start text-sm">
                 <span className="text-green-400 mr-2">✓</span>
                 <span className="text-gray-300">{signal.value}</span>
               </div>
             ))}
           </div>
         </div>

         <div className="flex gap-3">
           <button
             onClick={() => onApprove(setup.id)}
             className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
           >
             Approve Trade
           </button>
           <button
             onClick={() => onReject(setup.id)}
             className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
           >
             Reject
           </button>
         </div>
       </div>
     )
   }
   ```

### Expected Output
- Setup details card component created
- Shows entry, SL, TP, risk calculation, signals

### Files Created/Modified
- `apps/botbox/src/components/setup-details-card.tsx` (create)

---

## Task 5.7: Create Approval Dashboard Page (30 mins)

### Description
Build the main approval dashboard page integrating chart and setup cards.

### Steps
1. Create `apps/botbox/src/routes/approvals.tsx`:
   ```typescript
   import { createFileRoute } from '@tanstack/react-router'
   import { useState, useEffect } from 'react'
   import { TradingChart } from '../components/trading-chart'
   import { SetupDetailsCard } from '../components/setup-details-card'

   export const Route = createFileRoute('/approvals')({
     component: ApprovalsPage,
   })

   function ApprovalsPage() {
     const [setups, setSetups] = useState([])
     const [selectedSetup, setSelectedSetup] = useState(null)
     const [timeframe, setTimeframe] = useState('60')
     const [loading, setLoading] = useState(true)

     useEffect(() => {
       fetchPendingSetups()
       const interval = setInterval(fetchPendingSetups, 30000)
       return () => clearInterval(interval)
     }, [])

     async function fetchPendingSetups() {
       try {
         const response = await fetch('/api/setups/pending')
         const data = await response.json()
         setSetups(data)

         if (data.length > 0 && !selectedSetup) {
           setSelectedSetup(data[0])
           setTimeframe(data[0].timeframe)
         }

         setLoading(false)
       } catch (error) {
         console.error('Failed to fetch setups:', error)
         setLoading(false)
       }
     }

     async function handleApprove(setupId: number) {
       try {
         await fetch(`/api/setups/${setupId}/approve`, { method: 'POST' })
         await fetchPendingSetups()
         setSelectedSetup(null)
       } catch (error) {
         console.error('Failed to approve setup:', error)
       }
     }

     async function handleReject(setupId: number) {
       try {
         await fetch(`/api/setups/${setupId}/reject`, { method: 'POST' })
         await fetchPendingSetups()
         setSelectedSetup(null)
       } catch (error) {
         console.error('Failed to reject setup:', error)
       }
     }

     if (loading) {
       return (
         <div className="min-h-screen bg-gray-900 flex items-center justify-center">
           <p className="text-white">Loading pending setups...</p>
         </div>
       )
     }

     if (setups.length === 0) {
       return (
         <div className="min-h-screen bg-gray-900 flex items-center justify-center">
           <div className="text-center">
             <h1 className="text-2xl font-bold text-white mb-2">No Pending Setups</h1>
             <p className="text-gray-400">
               The bot will notify you when new trading setups are detected.
             </p>
           </div>
         </div>
       )
     }

     return (
       <div className="min-h-screen bg-gray-900 p-6">
         <h1 className="text-3xl font-bold text-white mb-6">Trading Setup Approvals</h1>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
             {selectedSetup && (
               <div className="mb-4">
                 <div className="flex gap-2 mb-4">
                   {['60', '240', 'D', 'W'].map(tf => (
                     <button
                       key={tf}
                       onClick={() => setTimeframe(tf)}
                       className={`px-4 py-2 rounded ${
                         timeframe === tf
                           ? 'bg-blue-600 text-white'
                           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                       }`}
                     >
                       {tf === '60' ? '1H' : tf === '240' ? '4H' : tf}
                     </button>
                   ))}
                 </div>

                 <TradingChart
                   symbol={selectedSetup.symbol}
                   timeframe={timeframe}
                   setupDetails={{
                     entryPrice: parseFloat(selectedSetup.entryPrice),
                     stopLoss: parseFloat(selectedSetup.stopLoss),
                     takeProfit1: parseFloat(selectedSetup.takeProfit1),
                     takeProfit2: parseFloat(selectedSetup.takeProfit2),
                     detectedAt: selectedSetup.detectedAt,
                   }}
                 />
               </div>
             )}
           </div>

           <div className="space-y-4">
             {setups.map(setup => (
               <div
                 key={setup.id}
                 onClick={() => {
                   setSelectedSetup(setup)
                   setTimeframe(setup.timeframe)
                 }}
                 className={`cursor-pointer ${
                   selectedSetup?.id === setup.id ? 'ring-2 ring-blue-500' : ''
                 }`}
               >
                 <SetupDetailsCard
                   setup={setup}
                   onApprove={handleApprove}
                   onReject={handleReject}
                 />
               </div>
             ))}
           </div>
         </div>
       </div>
     )
   }
   ```

### Expected Output
- Full approval dashboard page created
- Lists pending setups, displays chart, allows approval/rejection

### Files Created/Modified
- `apps/botbox/src/routes/approvals.tsx` (create)

---

## Task 5.8: Add Navigation Link (10 mins)

### Description
Add link to approvals page in main navigation.

### Steps
1. Update `apps/botbox/src/routes/__root.tsx`:
   ```typescript
   <nav className="flex gap-4">
     <Link to="/" className="text-white hover:text-blue-400">
       Home
     </Link>
     <Link to="/approvals" className="text-white hover:text-blue-400">
       Approvals {pendingCount > 0 && `(${pendingCount})`}
     </Link>
   </nav>
   ```

### Expected Output
- Approvals link in navigation
- Shows pending count badge

### Files Created/Modified
- `apps/botbox/src/routes/__root.tsx` (modify)

---

## Checkpoint: Phase 5 Complete

### Verification Checklist
- [ ] TradingView Lightweight Charts installed
- [ ] Pending setups API endpoint works
- [ ] Candles data API returns chart data
- [ ] Approve/reject API endpoints functional
- [ ] TradingChart component renders
- [ ] SetupDetailsCard shows all info
- [ ] Approval dashboard page displays setups
- [ ] Navigation includes approvals link

### Test the Dashboard
1. Start dev server: `npm run dev`
2. Navigate to `/approvals`
3. Should see pending setups with charts

### Next Phase
Proceed to `06-trade-execution.md` - Execute approved trades on Bybit testnet
