# Phase 1: Database Setup & Migration

## Overview

Set up Neon PostgreSQL with TimescaleDB extension, migrate schemas, and seed initial data.

**Estimated Time**: 4-6 hours (Week 1, Days 1-2)

## Prerequisites

- Neon account created
- Cloudflare account with Workers access
- Bybit testnet account

---

## Task 1.1: Create Neon Database Project (15 mins)

### Description

Set up a new Neon PostgreSQL project with TimescaleDB extension enabled.

### Steps

1. Go to https://neon.tech and sign up/login
2. Click "Create Project"
3. Configure:
   - Name: `botbox-trading`
   - Region: AWS US East (or closest to you)
   - PostgreSQL version: 17
4. Once created, go to SQL Editor
5. Run: `CREATE EXTENSION IF NOT EXISTS timescaledb;`
6. Verify: `SELECT * FROM pg_extension WHERE extname = 'timescaledb';`

### Expected Output

- Neon project dashboard showing "Active" status
- TimescaleDB extension listed in pg_extension table

### Files Created/Modified

None (external setup)

---

## Task 1.2: Get Neon Connection String (5 mins)

### Description

Retrieve the pooled connection string from Neon for use with Hyperdrive.

### Steps

1. In Neon dashboard, click "Connection Details"
2. Copy the connection string (format: `postgresql://user:pass@ep-xxx.aws.neon.tech/dbname?sslmode=require`)
3. Save to a secure location (you'll add to .env next)

### Expected Output

Connection string saved and ready to use

### Files Created/Modified

None yet (preparation step)

---

## Task 1.3: Create Cloudflare Hyperdrive Configuration (15 mins)

### Description

Set up Hyperdrive to provide connection pooling for Neon database access from Workers.

### Steps

1. Open terminal in project root
2. Run:
   ```bash
   npx wrangler hyperdrive create botbox-neon \
     --connection-string="YOUR_NEON_CONNECTION_STRING_HERE"
   ```
3. Copy the Hyperdrive ID from output (format: `abc123def456...`)
4. Save this ID for next step

### Expected Output

```
Created Hyperdrive config
ID: abc123def456...
```

### Files Created/Modified

None (Cloudflare infrastructure)

---

## Task 1.4: Update Environment Variables (10 mins)

### Description

Configure local environment variables and update wrangler.jsonc with Hyperdrive binding.

### Steps

1. Create `apps/botbox/.dev.vars` file:

   ```env
   NEON_URL=postgresql://user:pass@ep-xxx.aws.neon.tech/dbname?sslmode=require
   BYBIT_API_KEY=your-testnet-api-key
   BYBIT_API_SECRET=your-testnet-secret
   BYBIT_TESTNET=true
   ```

2. Update `apps/botbox/wrangler.jsonc` - add after `d1_databases` section:
   ```jsonc
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",
       "id": "b0a789835fab4dad8f248d93ab9cede4"
     }
   ],
   ```

### Expected Output

- `.dev.vars` file created with connection details
- `wrangler.jsonc` updated with Hyperdrive binding

### Files Created/Modified

- `apps/botbox/.dev.vars` (create)
- `apps/botbox/wrangler.jsonc` (modify)

---

## Task 1.5: Update Drizzle Config for Neon (15 mins)

### Description

Migrate Drizzle configuration from D1 (SQLite) to Neon (PostgreSQL).

### Steps

1. Update `apps/botbox/drizzle.config.ts`:

   ```typescript
   import { defineConfig } from "drizzle-kit";

   export default defineConfig({
     dialect: "postgresql",
     schema: "./src/db/schema/index.ts",
     out: "./migrations",
     dbCredentials: {
       url: process.env.NEON_URL!,
     },
   });
   ```

2. Install PostgreSQL driver:
   ```bash
   cd apps/botbox
   npm install postgres
   npm install --save-dev @types/pg
   ```

### Expected Output

- Drizzle config updated to use PostgreSQL dialect
- Dependencies installed

### Files Created/Modified

- `apps/botbox/drizzle.config.ts` (modify)
- `apps/botbox/package.json` (dependencies added)

---

## Task 1.6: Create Database Connection Helper (15 mins)

### Description

Create a reusable database connection module for use in Workers and scripts.

### Steps

1. Create `apps/botbox/src/db/connection.ts`:

   ```typescript
   import { drizzle } from "drizzle-orm/postgres-js";
   import postgres from "postgres";
   import * as schema from "./schema";

   export function createDbConnection(connectionString: string) {
     const client = postgres(connectionString);
     return drizzle(client, { schema });
   }

   export function createDbFromEnv(env: {
     HYPERDRIVE: { connectionString: string };
   }) {
     return createDbConnection(env.HYPERDRIVE.connectionString);
   }
   ```

### Expected Output

- Database connection helper created

### Files Created/Modified

- `apps/botbox/src/db/connection.ts` (create)

---

## Task 1.7: Update Schema Files for PostgreSQL (20 mins)

### Description

Convert D1-specific schema types to PostgreSQL equivalents (text → varchar, integer → serial, etc.).

### Steps

1. Update `apps/botbox/src/db/schema/users.schema.ts`:

   - Change `integer('id').primaryKey()` → `serial('id').primaryKey()`
   - Change `text('email')` → `varchar('email', { length: 255 })`
   - Add timestamps: `timestamp('created_at').defaultNow()`

2. Repeat for all schema files in `apps/botbox/src/db/schema/`:

   - `exchanges.schema.ts`
   - `credentials.schema.ts`
   - `instruments.schema.ts`
   - `bots.schema.ts`
   - `strategies.schema.ts`
   - `orders.schema.ts`
   - `trades.schema.ts`
   - `positions.schema.ts`
   - `candles.schema.ts` (special: will add hypertable in next task)
   - All other schema files

3. Replace SQLite types:
   - `integer` → `serial` (for auto-increment IDs) or `integer` (for foreign keys)
   - `text` → `varchar(length)` or `text` (for long content)
   - Add proper `timestamp` columns with `defaultNow()`

### Expected Output

- All schema files updated to use PostgreSQL types
- No compilation errors when running `npm run typecheck`

### Files Created/Modified

- `apps/botbox/src/db/schema/*.schema.ts` (modify all)

---

## Task 1.8: Create Candles Hypertable Schema (15 mins)

### Description

Define the candles table with proper structure for TimescaleDB hypertable conversion.

### Steps

1. Update `apps/botbox/src/db/schema/candles.schema.ts`:

   ```typescript
   import {
     pgTable,
     serial,
     integer,
     numeric,
     timestamp,
     varchar,
     index,
   } from "drizzle-orm/pg-core";
   import { instruments } from "./instruments.schema";

   export const candles = pgTable(
     "candles",
     {
       id: serial("id").primaryKey(),
       instrumentId: integer("instrument_id")
         .notNull()
         .references(() => instruments.id),
       timeframe: varchar("timeframe", { length: 10 }).notNull(),
       timestamp: timestamp("timestamp").notNull(),
       open: numeric("open", { precision: 20, scale: 8 }).notNull(),
       high: numeric("high", { precision: 20, scale: 8 }).notNull(),
       low: numeric("low", { precision: 20, scale: 8 }).notNull(),
       close: numeric("close", { precision: 20, scale: 8 }).notNull(),
       volume: numeric("volume", { precision: 20, scale: 8 }).notNull(),

       bbUpper: numeric("bb_upper", { precision: 20, scale: 8 }),
       bbMiddle: numeric("bb_middle", { precision: 20, scale: 8 }),
       bbLower: numeric("bb_lower", { precision: 20, scale: 8 }),
       rsi: numeric("rsi", { precision: 10, scale: 2 }),
       atr: numeric("atr", { precision: 20, scale: 8 }),
       volumeMa: numeric("volume_ma", { precision: 20, scale: 8 }),

       createdAt: timestamp("created_at").defaultNow(),
     },
     (table) => ({
       instrumentTimeframeTimestampIdx: index(
         "candles_instrument_timeframe_timestamp_idx"
       ).on(table.instrumentId, table.timeframe, table.timestamp.desc()),
       timestampIdx: index("candles_timestamp_idx").on(table.timestamp.desc()),
     })
   );
   ```

2. Create migration helper `apps/botbox/migrations/create-hypertable.sql`:
   ```sql
   SELECT create_hypertable('candles', 'timestamp', if_not_exists => TRUE);
   ```

### Expected Output

- Candles schema defined with indicator columns
- Indexes created for efficient queries
- Hypertable creation SQL ready

### Files Created/Modified

- `apps/botbox/src/db/schema/candles.schema.ts` (modify)
- `apps/botbox/migrations/create-hypertable.sql` (create)

---

## Task 1.9: Generate and Run Initial Migration (20 mins)

### Description

Generate migration files and apply them to Neon database.

### Steps

1. Generate migration:

   ```bash
   cd apps/botbox
   npm run db:generate
   ```

2. Review generated migration in `apps/botbox/migrations/` folder

3. Manually add hypertable conversion to the migration file (after CREATE TABLE candles):

   ```sql
   SELECT create_hypertable('candles', 'timestamp', if_not_exists => TRUE);
   ```

4. Apply migration to Neon:

   ```bash
   npm run db:migrate
   ```

5. Verify tables created:

   - Open Neon SQL Editor
   - Run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
   - Should see: users, exchanges, instruments, bots, candles, etc.

6. Verify hypertable:
   ```sql
   SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'candles';
   ```

### Expected Output

- Migration files generated
- All tables created in Neon
- Candles table converted to hypertable

### Files Created/Modified

- `apps/botbox/migrations/0000_*.sql` (generated)

---

## Task 1.10: Create Test Connection Script (15 mins)

### Description

Build a simple script to verify database connection and TimescaleDB functionality.

### Steps

1. Create `apps/botbox/scripts/test-connection.ts`:

   ```typescript
   import { config } from "dotenv";
   import { createDbConnection } from "../src/db/connection";
   import { sql } from "drizzle-orm";

   config({ path: ".dev.vars" });

   async function testConnection() {
     const db = createDbConnection(process.env.NEON_URL!);

     try {
       const result = await db.execute(sql`SELECT version()`);
       console.log("✓ Connected to database");
       console.log("PostgreSQL version:", result.rows[0].version);

       const tsdb = await db.execute(
         sql`SELECT * FROM pg_extension WHERE extname = 'timescaledb'`
       );
       if (tsdb.rows.length > 0) {
         console.log("✓ TimescaleDB extension is enabled");
       } else {
         console.log("✗ TimescaleDB extension NOT found");
       }

       const hypertable = await db.execute(sql`
         SELECT * FROM timescaledb_information.hypertables
         WHERE hypertable_name = 'candles'
       `);
       if (hypertable.rows.length > 0) {
         console.log("✓ Candles hypertable is configured");
       } else {
         console.log("✗ Candles hypertable NOT found");
       }

       process.exit(0);
     } catch (error) {
       console.error("✗ Connection failed:", error);
       process.exit(1);
     }
   }

   testConnection();
   ```

2. Add script to package.json:

   ```json
   "scripts": {
     "db:test": "tsx scripts/test-connection.ts"
   }
   ```

3. Run test:
   ```bash
   npm run db:test
   ```

### Expected Output

```
✓ Connected to database
PostgreSQL version: PostgreSQL 17.x
✓ TimescaleDB extension is enabled
✓ Candles hypertable is configured
```

### Files Created/Modified

- `apps/botbox/scripts/test-connection.ts` (create)
- `apps/botbox/package.json` (modify scripts)

---

## Task 1.11: Seed Instruments Table (20 mins)

### Description

Fetch top 10 crypto pairs from Bybit API and insert into instruments table.

### Steps

1. Create `apps/botbox/scripts/seed-instruments.ts`:

   ```typescript
   import { config } from "dotenv";
   import { createDbConnection } from "../src/db/connection";
   import { instruments } from "../src/db/schema";

   config({ path: ".dev.vars" });

   const TOP_10_PAIRS = [
     { symbol: "BTCUSDT", name: "Bitcoin", marketCap: 1 },
     { symbol: "ETHUSDT", name: "Ethereum", marketCap: 2 },
     { symbol: "SOLUSDT", name: "Solana", marketCap: 3 },
     { symbol: "BNBUSDT", name: "BNB", marketCap: 4 },
     { symbol: "XRPUSDT", name: "Ripple", marketCap: 5 },
     { symbol: "ADAUSDT", name: "Cardano", marketCap: 6 },
     { symbol: "AVAXUSDT", name: "Avalanche", marketCap: 7 },
     { symbol: "DOGEUSDT", name: "Dogecoin", marketCap: 8 },
     { symbol: "DOTUSDT", name: "Polkadot", marketCap: 9 },
     { symbol: "MATICUSDT", name: "Polygon", marketCap: 10 },
   ];

   async function seedInstruments() {
     const db = createDbConnection(process.env.NEON_URL!);

     console.log("Seeding instruments...");

     for (const pair of TOP_10_PAIRS) {
       await db
         .insert(instruments)
         .values({
           symbol: pair.symbol,
           name: pair.name,
           exchange: "bybit",
           instrumentType: "spot",
           baseCurrency: pair.symbol.replace("USDT", ""),
           quoteCurrency: "USDT",
           isActive: true,
         })
         .onConflictDoNothing();

       console.log(`✓ Inserted ${pair.symbol}`);
     }

     console.log("✓ Instruments seeded successfully");
     process.exit(0);
   }

   seedInstruments().catch(console.error);
   ```

2. Add script to package.json:

   ```json
   "db:seed": "tsx scripts/seed-instruments.ts"
   ```

3. Run:
   ```bash
   npm run db:seed
   ```

### Expected Output

```
Seeding instruments...
✓ Inserted BTCUSDT
✓ Inserted ETHUSDT
...
✓ Instruments seeded successfully
```

### Files Created/Modified

- `apps/botbox/scripts/seed-instruments.ts` (create)
- `apps/botbox/package.json` (modify)

---

## Task 1.12: Create Job Logs Table (15 mins)

### Description

Add a table for tracking cron job executions and debugging.

### Steps

1. Create `apps/botbox/src/db/schema/job-logs.schema.ts`:

   ```typescript
   import {
     pgTable,
     serial,
     varchar,
     timestamp,
     text,
   } from "drizzle-orm/pg-core";

   export const jobLogs = pgTable("job_logs", {
     id: serial("id").primaryKey(),
     jobType: varchar("job_type", { length: 100 }).notNull(),
     status: varchar("status", { length: 20 }).notNull(),
     message: text("message"),
     error: text("error"),
     startedAt: timestamp("started_at").notNull().defaultNow(),
     completedAt: timestamp("completed_at"),
     durationMs: integer("duration_ms"),
   });
   ```

2. Export from `apps/botbox/src/db/schema/index.ts`:

   ```typescript
   export * from "./job-logs.schema";
   ```

3. Generate and run migration:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Expected Output

- Job logs table created
- Ready for cron job logging

### Files Created/Modified

- `apps/botbox/src/db/schema/job-logs.schema.ts` (create)
- `apps/botbox/src/db/schema/index.ts` (modify)

---

## Checkpoint: Phase 1 Complete

### Verification Checklist

- [ ] Neon project created and active
- [ ] TimescaleDB extension enabled
- [ ] Hyperdrive configured in Cloudflare
- [ ] All schema files migrated to PostgreSQL
- [ ] Candles table is a hypertable
- [ ] Test connection script passes
- [ ] 10 instruments seeded
- [ ] Job logs table created

### Next Phase

Proceed to `02-data-backfill.md` - Historical candle data backfill
