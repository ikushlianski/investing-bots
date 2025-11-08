-- Optional: Add data retention policy
-- This will automatically drop chunks older than the specified interval
-- Uncomment and adjust the interval based on your needs

-- Example: Keep only 90 days of candle data
-- SELECT add_retention_policy('candles', INTERVAL '90 days', if_not_exists => TRUE);

-- Example: Keep 1 year of data
-- SELECT add_retention_policy('candles', INTERVAL '1 year', if_not_exists => TRUE);

-- Note: You can remove the retention policy with:
-- SELECT remove_retention_policy('candles');
