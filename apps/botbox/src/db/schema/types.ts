import { customType } from 'drizzle-orm/sqlite-core'

/**
 * Custom numeric type for SQLite with exact precision.
 *
 * Uses SQLite's NUMERIC affinity which stores values as TEXT when needed,
 * ensuring exact precision for financial calculations (unlike REAL which
 * uses IEEE-754 floating point with potential rounding errors).
 *
 * Trading precision guidelines:
 * - Prices: numeric(20, 8) - Supports crypto (8 decimals) and all asset types
 * - Quantities: numeric(20, 8) - Fractional units for crypto
 * - Percentages: numeric(10, 4) - Sufficient for 0.0001% to 999.9999%
 * - Ratios: numeric(8, 4) - Risk/reward ratios like 10.5:1
 * - Fees: numeric(18, 8) - Small fees with precision
 * - Volume: numeric(30, 8) - Large volumes with crypto precision
 * - Metrics: numeric(12, 6) - Calculated indicators (volatility, trend)
 * - Confidence: numeric(6, 4) - 0-100 scale with 4 decimals
 *
 * @example
 * numeric('price') // Basic usage (unlimited precision)
 * numeric('price', { precision: 20, scale: 8 }) // Price with 8 decimals
 */
export const numeric = customType<{
  data: number
  driverData: string | number
  config: { precision?: number; scale?: number }
}>({
  dataType(config) {
    if (config?.precision && config?.scale) {
      return `numeric(${config.precision},${config.scale})`
    }

    return 'numeric'
  },
  toDriver(value: number): string {
    return value.toString()
  },

  fromDriver(value: string | number): number {
    if (typeof value === 'number') {
      return value
    }

    return parseFloat(value)
  },
})
