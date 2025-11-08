-- Enable TimescaleDB extension
-- This must be run with superuser privileges or by Neon support
-- On Neon, TimescaleDB is already installed, you just need to enable it

CREATE EXTENSION IF NOT EXISTS timescaledb;
