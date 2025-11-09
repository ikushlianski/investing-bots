# Phase 7: Deployment & Live Testing

## Overview
Deploy to Cloudflare Workers, run 1-week testnet trial, document operations.

**Estimated Time**: Variable (Week 4+)

---

## Task 7.1: Prepare Production Environment Variables (10 mins)

### Description
Configure production secrets in Cloudflare.

### Steps
1. Add secrets via wrangler:
   ```bash
   cd apps/botbox
   npx wrangler secret put BYBIT_API_KEY
   npx wrangler secret put BYBIT_API_SECRET
   npx wrangler secret put NEON_URL
   ```

2. Update wrangler.jsonc with production vars:
   ```jsonc
   {
     "vars": {
       "BYBIT_TESTNET": "true",
     }
   }
   ```

### Expected Output
- Secrets stored in Cloudflare
- Production vars configured

### Files Created/Modified
- None (Cloudflare infrastructure)

---

## Task 7.2: Deploy to Cloudflare Workers (15 mins)

### Description
Deploy the application to production.

### Steps
1. Build and deploy:
   ```bash
   npm run build
   npm run deploy
   ```

2. Verify deployment:
   - Visit your Worker URL
   - Check homepage loads
   - Test `/approvals` route

3. Check logs:
   ```bash
   npx wrangler tail
   ```

### Expected Output
```
Uploaded botbox (X.XX sec)
Published botbox
  https://botbox.your-subdomain.workers.dev
```

### Files Created/Modified
None (deployment operation)

---

## Task 7.3: Verify Cron Trigger is Running (10 mins)

### Description
Confirm scheduled job executes every 5 minutes.

### Steps
1. Check Cloudflare dashboard → Workers → Cron Triggers
2. Verify schedule shows: `*/5 * * * *`
3. Monitor logs for cron execution:
   ```bash
   npx wrangler tail --format pretty
   ```

4. Wait 5-10 minutes, should see:
   ```
   [Cron] Starting scheduled job at...
   [Cron] Recording new candles...
   [Cron] Running trading loop...
   [Cron] Monitoring open trades...
   [Cron] Scheduled job complete
   ```

### Expected Output
- Cron trigger active
- Logs show execution every 5 mins

### Files Created/Modified
None (verification)

---

## Task 7.4: Create Operational Runbook (30 mins)

### Description
Document how to operate and troubleshoot the bot.

### Steps
1. Create `docs/runbook.md`:
   ```markdown
   # BotBox Version 0 - Operational Runbook

   ## System Overview
   - **Purpose**: Automated Bollinger Band mean reversion trading bot
   - **Exchange**: Bybit Testnet (spot trading)
   - **Instruments**: 10 pairs (BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOGE, DOT, MATIC)
   - **Strategy**: ST-002 Mean Reversion (Lower BB Bounce, Upper BB Rejection)
   - **Capital**: $10,000 testnet USDT
   - **Risk**: 1% per trade, max 8 concurrent positions

   ## Daily Checklist
   1. **Check Pending Approvals** (Every 1-2 hours during trading hours)
      - Visit: https://botbox.your-subdomain.workers.dev/approvals
      - Review any pending setups
      - Approve or reject within 1-2 hours

   2. **Monitor Active Trades** (Once per day)
      - Check trade status in Neon database or via API
      - Verify orders are being monitored

   3. **Review Job Logs** (Once per day)
      - Check for errors in cron execution
      - Verify candles are being recorded

   ## How to Check System Health

   ### Check Cron Logs
   ```bash
   npx wrangler tail --format pretty
   ```

   Look for:
   - `[Cron] Starting scheduled job` every 5 minutes
   - `Recorded X candles` (should be 10-40 depending on time)
   - `Detected X setups` (0-3 typically)
   - `Checked X trades` (number of open positions)

   ### Check Database Health
   Query in Neon SQL Editor:
   ```sql
   -- Latest candles recorded
   SELECT instrument_id, timeframe, MAX(timestamp) as latest
   FROM candles
   GROUP BY instrument_id, timeframe
   ORDER BY instrument_id, timeframe;

   -- Should show timestamps within last hour

   -- Active setups
   SELECT COUNT(*) FROM setups_v0 WHERE status = 'ACTIVE';

   -- Open trades
   SELECT * FROM trades WHERE status = 'OPEN';
   ```

   ### Check Bybit Account
   - Login to Bybit Testnet
   - Verify balance hasn't blown up
   - Check open orders

   ## Common Operations

   ### Manually Trigger Trading Loop
   ```bash
   cd apps/botbox
   npm run test:trading
   ```

   ### Manually Record Candles
   ```bash
   npm run test:recording
   ```

   ### Check Pending Setups (CLI)
   ```bash
   npm run db:query "SELECT * FROM setups_v0 WHERE status = 'ACTIVE'"
   ```

   ### Manually Execute Trade (Dangerous!)
   Only use if approval UI is broken:
   ```bash
   npm run test:execution
   ```

   ## Troubleshooting

   ### Bot Not Detecting Setups
   **Symptoms**: No setups for 24+ hours

   **Possible Causes**:
   1. Market is trending (ATR > 1.3× average)
   2. RSI not reaching oversold/overbought levels
   3. Volume too low

   **Solution**: This is normal. Mean reversion setups only occur in ranging markets.

   ### Candles Not Being Recorded
   **Symptoms**: Latest candle timestamp > 1 hour old

   **Check**:
   1. Cron trigger is enabled in Cloudflare dashboard
   2. Bybit API is responding (check logs for errors)
   3. Rate limits not exceeded

   **Solution**:
   ```bash
   # Manually backfill missing candles
   npm run db:backfill-recent  # (you may need to create this script)
   ```

   ### Trades Not Closing at SL/TP
   **Symptoms**: Open trade past SL/TP levels

   **Check**:
   1. Order monitor is running in cron
   2. Bybit orders are placed correctly
   3. Check trade record in database

   **Solution**:
   ```bash
   # Manually close trade on Bybit
   # Then update database:
   UPDATE trades SET status = 'CLOSED', exit_price = 'XXXX', exit_time = NOW() WHERE id = X;
   ```

   ### Approval Dashboard Not Loading
   **Check**:
   1. Worker is deployed
   2. Database connection works
   3. Check browser console for errors

   **Solution**:
   ```bash
   npm run deploy  # Redeploy
   ```

   ## Emergency Procedures

   ### Stop All Trading Immediately
   1. **Disable cron trigger**:
      - Cloudflare Dashboard → Workers → botbox → Triggers → Delete cron trigger

   2. **Close all open positions**:
      - Login to Bybit testnet
      - Manually close all open spot positions
      - Update database: `UPDATE trades SET status = 'CLOSED' WHERE status = 'OPEN'`

   3. **Invalidate pending setups**:
      ```sql
      UPDATE setups_v0 SET status = 'INVALIDATED' WHERE status = 'ACTIVE';
      ```

   ### Resume Trading
   1. Fix the issue
   2. Re-enable cron in wrangler.jsonc
   3. Redeploy: `npm run deploy`

   ## Metrics to Track

   ### Success Metrics (Version 0)
   - Setups detected: Target 5+ in first week
   - Trades executed: Target 3-5 complete trades
   - System uptime: Target 99%+
   - Win rate: Observe only (target >55% later)

   ### Key Performance Indicators
   ```sql
   -- Total setups detected
   SELECT COUNT(*) FROM setups_v0;

   -- Setups by type
   SELECT setup_type, COUNT(*) FROM setups_v0 GROUP BY setup_type;

   -- Trades by status
   SELECT status, COUNT(*) FROM trades GROUP BY status;

   -- Win rate (after 10+ trades)
   SELECT
     COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins,
     COUNT(CASE WHEN pnl < 0 THEN 1 END) as losses,
     (COUNT(CASE WHEN pnl > 0 THEN 1 END)::float / COUNT(*)::float * 100) as win_rate_pct
   FROM trades
   WHERE status = 'CLOSED';

   -- Total P&L
   SELECT SUM(pnl::float) as total_pnl FROM trades WHERE status = 'CLOSED';
   ```

   ## Support & Resources

   - **Neon Dashboard**: https://console.neon.tech
   - **Cloudflare Dashboard**: https://dash.cloudflare.com
   - **Bybit Testnet**: https://testnet.bybit.com
   - **Project Repo**: /path/to/repo
   - **PRD**: prd/prd-000-botbox-toddler/

   ## Weekly Review Checklist

   After 1 week of operation:
   - [ ] Setups detected: _____ (target: 5+)
   - [ ] Trades completed: _____ (target: 3-5)
   - [ ] Win rate: _____% (observe)
   - [ ] Total P&L: $_____
   - [ ] System crashes: _____ (target: 0)
   - [ ] Manual interventions required: _____ (target: <3)
   - [ ] Approval response time: _____ (target: <2 hours avg)

   ## Version 0 Success Criteria
   - ✓ Bot detected 5+ valid setups
   - ✓ You approved and completed 3-5 full trades
   - ✓ System ran stable for 1 week
   - ✓ You understand every decision the bot makes

   If all criteria met → **Version 0 COMPLETE** → Proceed to Version 0.5 (Backtesting)
   ```

### Expected Output
- Comprehensive runbook created
- All operations documented

### Files Created/Modified
- `docs/runbook.md` (create)

---

## Task 7.5: Create Monitoring Dashboard (30 mins)

### Description
Build simple home page with system stats.

### Steps
1. Update `apps/botbox/src/routes/index.tsx`:
   ```typescript
   import { createFileRoute } from '@tanstack/react-router'
   import { useState, useEffect } from 'react'

   export const Route = createFileRoute('/')({
     component: HomePage,
   })

   function HomePage() {
     const [stats, setStats] = useState(null)
     const [loading, setLoading] = useState(true)

     useEffect(() => {
       fetchStats()
       const interval = setInterval(fetchStats, 60000)
       return () => clearInterval(interval)
     }, [])

     async function fetchStats() {
       try {
         const [pendingSetups, allTrades, openTrades] = await Promise.all([
           fetch('/api/setups/pending').then(r => r.json()),
           fetch('/api/trades').then(r => r.json()),
           fetch('/api/trades?status=open').then(r => r.json()),
         ])

         const closedTrades = allTrades.filter(t => t.status === 'CLOSED')
         const wins = closedTrades.filter(t => parseFloat(t.pnl) > 0).length
         const losses = closedTrades.filter(t => parseFloat(t.pnl) < 0).length
         const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0

         const totalPnl = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)

         setStats({
           pendingSetups: pendingSetups.length,
           openTrades: openTrades.length,
           totalTrades: allTrades.length,
           wins,
           losses,
           winRate,
           totalPnl,
         })

         setLoading(false)
       } catch (error) {
         console.error('Failed to fetch stats:', error)
         setLoading(false)
       }
     }

     if (loading) {
       return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
         <p className="text-white">Loading...</p>
       </div>
     }

     return (
       <div className="min-h-screen bg-gray-900 p-6">
         <h1 className="text-4xl font-bold text-white mb-8">BotBox Trading Dashboard</h1>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
             <p className="text-gray-400 text-sm mb-1">Pending Approvals</p>
             <p className="text-4xl font-bold text-yellow-400">{stats.pendingSetups}</p>
             {stats.pendingSetups > 0 && (
               <a href="/approvals" className="text-sm text-blue-400 hover:underline mt-2 block">
                 Review now →
               </a>
             )}
           </div>

           <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
             <p className="text-gray-400 text-sm mb-1">Open Positions</p>
             <p className="text-4xl font-bold text-blue-400">{stats.openTrades}</p>
             <p className="text-sm text-gray-500 mt-1">Max: 8</p>
           </div>

           <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
             <p className="text-gray-400 text-sm mb-1">Total Trades</p>
             <p className="text-4xl font-bold text-white">{stats.totalTrades}</p>
             <p className="text-sm text-gray-500 mt-1">
               {stats.wins}W / {stats.losses}L
             </p>
           </div>

           <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
             <p className="text-gray-400 text-sm mb-1">Total P&L</p>
             <p className={`text-4xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
               ${stats.totalPnl.toFixed(2)}
             </p>
             <p className="text-sm text-gray-500 mt-1">
               Win Rate: {stats.winRate.toFixed(1)}%
             </p>
           </div>
         </div>

         <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
           <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
           <div className="space-y-2">
             <div className="flex justify-between">
               <span className="text-gray-400">Exchange</span>
               <span className="text-green-400">Bybit Testnet ✓</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-400">Database</span>
               <span className="text-green-400">Neon PostgreSQL ✓</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-400">Cron Job</span>
               <span className="text-green-400">Every 5 minutes ✓</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-400">Strategy</span>
               <span className="text-white">ST-002 Mean Reversion</span>
             </div>
           </div>
         </div>
       </div>
     )
   }
   ```

### Expected Output
- Home page shows key metrics
- Pending approvals highlighted
- Auto-refreshes every minute

### Files Created/Modified
- `apps/botbox/src/routes/index.tsx` (modify)

---

## Task 7.6: 1-Week Live Test Period (7 days)

### Description
Run bot live on testnet for 1 week, monitor and document.

### Daily Tasks (15 mins per day)
1. **Morning Check** (10 mins)
   - Visit dashboard
   - Check pending approvals
   - Review any closed trades from overnight

2. **Approval Response** (5 mins per setup, as needed)
   - Check approvals page every 1-2 hours during day
   - Review chart and signals
   - Approve or reject

3. **End of Day Review** (10 mins)
   - Check job logs for errors
   - Note any issues in a log file
   - Record daily metrics

### Daily Log Template
Create `logs/week1-day1.md`:
```markdown
# Day 1 - [Date]

## Setups
- Detected: X
- Approved: Y
- Rejected: Z
- Reasons for rejection: ...

## Trades
- Opened: X
- Closed: Y
- P&L today: $XXX

## Issues
- None / [describe any issues]

## Notes
- Market conditions: ranging / trending
- Bot behavior: normal / unusual
- Any manual interventions: none / [describe]
```

### Expected Output
- 7 daily log files
- Bot runs continuously
- 5+ setups detected
- 3-5 trades completed

### Files Created/Modified
- `logs/week1-day1.md` through `logs/week1-day7.md` (create)

---

## Task 7.7: Week 1 Review & Success Evaluation (30 mins)

### Description
After 1 week, evaluate if Version 0 success criteria are met.

### Steps
1. Run metrics queries:
   ```sql
   -- Setups detected
   SELECT COUNT(*), setup_type FROM setups_v0 GROUP BY setup_type;

   -- Trades completed
   SELECT status, COUNT(*) FROM trades GROUP BY status;

   -- Win rate
   SELECT
     COUNT(*) as total,
     COUNT(CASE WHEN pnl::float > 0 THEN 1 END) as wins,
     (COUNT(CASE WHEN pnl::float > 0 THEN 1 END)::float / COUNT(*)::float * 100) as win_rate
   FROM trades WHERE status = 'CLOSED';

   -- P&L breakdown
   SELECT
     direction,
     COUNT(*) as trades,
     SUM(pnl::float) as total_pnl,
     AVG(pnl::float) as avg_pnl
   FROM trades WHERE status = 'CLOSED'
   GROUP BY direction;
   ```

2. Create `logs/week1-review.md`:
   ```markdown
   # Week 1 Review - Version 0 Evaluation

   ## Success Criteria

   ### Criterion 1: Bot detected 5+ valid setups
   - **Result**: [X] setups detected
   - **Status**: ✓ PASS / ✗ FAIL

   ### Criterion 2: Completed 3-5 full trades
   - **Result**: [X] trades completed
   - **Status**: ✓ PASS / ✗ FAIL

   ### Criterion 3: System ran stable for 1 week
   - **Uptime**: [X]%
   - **Crashes**: [X]
   - **Status**: ✓ PASS / ✗ FAIL

   ### Criterion 4: You understand every decision
   - **Setup explanations clear**: ✓ YES / ✗ NO
   - **Risk calculations transparent**: ✓ YES / ✗ NO
   - **Status**: ✓ PASS / ✗ FAIL

   ## Performance Metrics

   - **Total Setups**: [X]
     - Lower BB Bounce: [X]
     - Upper BB Rejection: [X]

   - **Total Trades**: [X]
     - Open: [X]
     - Closed: [X]

   - **Win Rate**: [X]%

   - **Total P&L**: $[X]
     - Wins: [X] ($[X] total)
     - Losses: [X] ($[X] total)

   - **Average Trade Duration**: [X] hours

   ## Observations

   ### What Worked Well
   - ...

   ### What Needs Improvement
   - ...

   ### Unexpected Behaviors
   - ...

   ## Version 0 Status

   [ ] All criteria met → **VERSION 0 COMPLETE**
   [ ] Some criteria not met → Continue testing or iterate

   ## Next Steps

   If Version 0 complete:
   - Proceed to Version 0.5: Backtesting
   - Build backtest engine
   - Validate strategy over 2 years
   - Target metrics: Win rate >55%, Drawdown <20%, Sharpe >1.0

   If not complete:
   - [ ] Specific improvements needed: ...
   - [ ] Continue testing for another week
   - [ ] Re-evaluate after Week 2
   ```

### Expected Output
- Week 1 review document
- Clear pass/fail on Version 0 criteria
- Decision on next steps

### Files Created/Modified
- `logs/week1-review.md` (create)

---

## Checkpoint: Version 0 Complete (if criteria met)

### Final Verification

If all success criteria are met:
- ✓ Bot detected 5+ setups
- ✓ Completed 3-5 trades
- ✓ System stable for 1 week
- ✓ Decision transparency achieved

**Congratulations! Version 0 is complete.**

### What You've Built

A fully functional automated trading bot that:
- Records candles for 10 crypto pairs (1H, 4H, 1D, 1W)
- Calculates Bollinger Bands, RSI, ATR indicators
- Detects market regimes (ranging vs trending)
- Scans for mean reversion setups
- Presents setups visually with TradingView charts
- Requires manual approval before trading
- Executes trades on Bybit testnet
- Monitors positions and closes at SL/TP
- Logs all decisions for transparency

### Architecture Summary

**Frontend**:
- React 19 + TanStack Router
- TradingView Lightweight Charts
- Approval dashboard with visual setup review

**Backend**:
- Cloudflare Workers (serverless)
- Neon PostgreSQL + TimescaleDB (time series data)
- Cron scheduler (every 5 minutes)

**Trading Logic**:
- ST-002 Bollinger Band Mean Reversion
- ATR-based regime detection
- 4-signal setup confirmation
- 1% risk per trade
- Position sizing with risk management

**Data Pipeline**:
- Bybit API → Candles → Indicators → Setup Scanner → Approval → Execution → Monitoring

### Metrics to Share

- Lines of code: ~3,000-4,000
- Database tables: 15+
- API endpoints: 10+
- Timeframes monitored: 4
- Instruments tracked: 10
- Candles stored: 227,000+
- Development time: 4 weeks

---

## Next Phase: Version 0.5 - Backtesting

Goals:
- Build separate backtest engine
- Simulate 2 years of trading
- Validate win rate >55%
- Validate max drawdown <20%
- Validate Sharpe ratio >1.0

If backtest passes → Version 0.6: Live trading with tiny capital ($500-1000)

---

## Support & Maintenance

### Weekly Tasks
- Check system health (5 mins)
- Review any failed cron jobs
- Ensure candles are recording
- Monitor Neon database size

### Monthly Tasks
- Review total trades and performance
- Update instruments if needed
- Adjust strategy parameters if data suggests
- Backup database

### When to Iterate to Version 1.0

After successful backtest and 10+ real money trades:
- Add breakeven stops
- Add trailing stops
- Add position management
- Add Telegram notifications
- Add more strategies
- Build full analytics dashboard

**End of Version 0 Plan**
