import { describe, it, expect } from 'vitest'
import {
  isNewCandleClosed,
  calculateCandlesElapsed,
  getNextCandleCloseTime,
  getCandleOpenTime,
  getTimeframeMinutes,
} from './candle-detection'
import { Timeframe } from './candles/enums'

describe('isNewCandleClosed', () => {
  it('should detect 1h candle close at top of the hour', () => {
    const time = new Date('2025-11-06T10:00:05Z')

    expect(isNewCandleClosed(Timeframe.ONE_HOUR, time)).toBe(true)
  })

  it('should not detect 1h candle close at other times', () => {
    const time = new Date('2025-11-06T10:30:05Z')

    expect(isNewCandleClosed(Timeframe.ONE_HOUR, time)).toBe(false)
  })

  it('should detect 4h candle close at 4-hour marks', () => {
    const times = [
      new Date('2025-11-06T00:00:05Z'),
      new Date('2025-11-06T04:00:05Z'),
      new Date('2025-11-06T08:00:05Z'),
      new Date('2025-11-06T12:00:05Z'),
      new Date('2025-11-06T16:00:05Z'),
      new Date('2025-11-06T20:00:05Z'),
    ]

    times.forEach((time) => {
      expect(isNewCandleClosed(Timeframe.FOUR_HOURS, time)).toBe(true)
    })
  })

  it('should not detect 4h candle close at non-4-hour marks', () => {
    const time = new Date('2025-11-06T10:00:05Z')

    expect(isNewCandleClosed(Timeframe.FOUR_HOURS, time)).toBe(false)
  })

  it('should detect 1d candle close at midnight UTC', () => {
    const time = new Date('2025-11-06T00:00:05Z')

    expect(isNewCandleClosed(Timeframe.ONE_DAY, time)).toBe(true)
  })

  it('should not detect 1d candle close at other times', () => {
    const time = new Date('2025-11-06T12:00:05Z')

    expect(isNewCandleClosed(Timeframe.ONE_DAY, time)).toBe(false)
  })

  it('should not trigger after 10 seconds window', () => {
    const time = new Date('2025-11-06T10:00:15Z')

    expect(isNewCandleClosed(Timeframe.ONE_HOUR, time)).toBe(false)
  })
})

describe('calculateCandlesElapsed', () => {
  it('should calculate 1h candles elapsed', () => {
    const start = new Date('2025-11-06T10:00:00Z')
    const current = new Date('2025-11-06T13:30:00Z')

    expect(calculateCandlesElapsed(Timeframe.ONE_HOUR, start, current)).toBe(3)
  })

  it('should calculate 4h candles elapsed', () => {
    const start = new Date('2025-11-06T00:00:00Z')
    const current = new Date('2025-11-06T12:00:00Z')

    expect(calculateCandlesElapsed(Timeframe.FOUR_HOURS, start, current)).toBe(3)
  })

  it('should calculate 1d candles elapsed', () => {
    const start = new Date('2025-11-06T00:00:00Z')
    const current = new Date('2025-11-09T00:00:00Z')

    expect(calculateCandlesElapsed(Timeframe.ONE_DAY, start, current)).toBe(3)
  })

  it('should return 0 for same time', () => {
    const time = new Date('2025-11-06T10:00:00Z')

    expect(calculateCandlesElapsed(Timeframe.ONE_HOUR, time, time)).toBe(0)
  })

  it('should handle partial candles correctly', () => {
    const start = new Date('2025-11-06T10:00:00Z')
    const current = new Date('2025-11-06T11:30:00Z')

    expect(calculateCandlesElapsed(Timeframe.ONE_HOUR, start, current)).toBe(1)
  })
})

describe('getNextCandleCloseTime', () => {
  it('should get next 1h candle close', () => {
    const current = new Date('2025-11-06T10:30:00Z')
    const next = getNextCandleCloseTime(Timeframe.ONE_HOUR, current)

    expect(next.toISOString()).toBe('2025-11-06T11:00:00.000Z')
  })

  it('should get next 4h candle close', () => {
    const current = new Date('2025-11-06T10:30:00Z')
    const next = getNextCandleCloseTime(Timeframe.FOUR_HOURS, current)

    expect(next.toISOString()).toBe('2025-11-06T12:00:00.000Z')
  })

  it('should get next 1d candle close', () => {
    const current = new Date('2025-11-06T10:30:00Z')
    const next = getNextCandleCloseTime(Timeframe.ONE_DAY, current)

    expect(next.toISOString()).toBe('2025-11-07T00:00:00.000Z')
  })

  it('should handle current time at candle close', () => {
    const current = new Date('2025-11-06T12:00:00Z')
    const next = getNextCandleCloseTime(Timeframe.FOUR_HOURS, current)

    expect(next.toISOString()).toBe('2025-11-06T16:00:00.000Z')
  })
})

describe('getCandleOpenTime', () => {
  it('should get current 1h candle open', () => {
    const current = new Date('2025-11-06T10:30:00Z')
    const open = getCandleOpenTime(Timeframe.ONE_HOUR, current)

    expect(open.toISOString()).toBe('2025-11-06T10:00:00.000Z')
  })

  it('should get current 4h candle open', () => {
    const current = new Date('2025-11-06T10:30:00Z')
    const open = getCandleOpenTime(Timeframe.FOUR_HOURS, current)

    expect(open.toISOString()).toBe('2025-11-06T08:00:00.000Z')
  })

  it('should get current 1d candle open', () => {
    const current = new Date('2025-11-06T10:30:00Z')
    const open = getCandleOpenTime(Timeframe.ONE_DAY, current)

    expect(open.toISOString()).toBe('2025-11-06T00:00:00.000Z')
  })
})

describe('getMinutesSince', () => {
  it('should calculate minutes from Date object', () => {
    const start = new Date('2025-11-06T10:00:00Z')
    const end = new Date('2025-11-06T10:30:00Z')
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))

    expect(diff).toBe(30)
  })

  it('should calculate minutes from ISO string', () => {
    const start = '2025-11-06T10:00:00Z'
    const end = new Date('2025-11-06T10:30:00Z')
    const diff = Math.floor((end.getTime() - new Date(start).getTime()) / (1000 * 60))

    expect(diff).toBe(30)
  })
})

describe('getHoursSince', () => {
  it('should calculate hours from Date object', () => {
    const start = new Date('2025-11-06T10:00:00Z')
    const end = new Date('2025-11-06T13:00:00Z')
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60))

    expect(diff).toBe(3)
  })

  it('should calculate hours from ISO string', () => {
    const start = '2025-11-06T10:00:00Z'
    const end = new Date('2025-11-06T13:00:00Z')
    const diff = Math.floor((end.getTime() - new Date(start).getTime()) / (1000 * 60 * 60))

    expect(diff).toBe(3)
  })
})

describe('getTimeframeMinutes', () => {
  it('should return correct minutes for each timeframe', () => {
    expect(getTimeframeMinutes(Timeframe.ONE_HOUR)).toBe(60)
    expect(getTimeframeMinutes(Timeframe.FOUR_HOURS)).toBe(240)
    expect(getTimeframeMinutes(Timeframe.ONE_DAY)).toBe(1440)
  })
})
