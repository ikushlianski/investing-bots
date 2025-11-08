-- Convert the candles table to a TimescaleDB hypertable
-- This should be run AFTER the candles table is created by Drizzle migrations
-- The table will be partitioned by the 'timestamp' column

SELECT create_hypertable(
  'candles',
  'timestamp',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Optional: Set chunk time interval (default is 7 days)
-- Adjust based on your data volume and query patterns
SELECT set_chunk_time_interval('candles', INTERVAL '7 days');
