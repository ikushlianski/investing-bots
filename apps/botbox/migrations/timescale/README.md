# TimescaleDB Setup for Candles Hypertable

This directory contains SQL scripts for setting up TimescaleDB hypertable for the candles table.

## Prerequisites

- Neon PostgreSQL database
- TimescaleDB extension (already available on Neon)

## Setup Instructions

### 1. Enable TimescaleDB Extension

Run this once per database:

```bash
psql $DATABASE_URL -f 01-enable-timescaledb.sql
```

Or via Neon SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### 2. Create Hypertable

After running Drizzle migrations to create the candles table, convert it to a hypertable:

```bash
psql $DATABASE_URL -f 02-create-hypertable.sql
```

### 3. Optional: Set Retention Policy

If you want automatic data cleanup:

```bash
psql $DATABASE_URL -f 03-retention-policy.sql
```

## Verification

Check if hypertable was created successfully:

```sql
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'candles';
```

## Migration Order

1. Run Drizzle migrations: `npm run db:generate && npm run db:push`
2. Enable TimescaleDB: `psql $DATABASE_URL -f migrations/timescale/01-enable-timescaledb.sql`
3. Create hypertable: `psql $DATABASE_URL -f migrations/timescale/02-create-hypertable.sql`
4. (Optional) Set retention: Edit and run `03-retention-policy.sql`

## Benefits

- **Automatic partitioning** by time (7-day chunks by default)
- **Faster time-range queries** on large datasets
- **Efficient storage** for time-series data
- **Automatic data retention** (optional)

## Important Notes

- Neon supports TimescaleDB but **compression is NOT available** (only Apache-2 licensed features)
- Once a table is converted to a hypertable, it cannot be easily reverted
- The `timestamp` column becomes the time dimension and must be present in all queries
