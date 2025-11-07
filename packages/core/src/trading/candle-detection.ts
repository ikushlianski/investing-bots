import { Timeframe } from './candles/enums'

export function isNewCandleClosed(timeframe: Timeframe, currentTime: Date): boolean {
  const minute = currentTime.getUTCMinutes()
  const second = currentTime.getUTCSeconds()
  const hour = currentTime.getUTCHours()

  if (timeframe === Timeframe.ONE_HOUR) {
    return minute === 0 && second < 10
  }

  if (timeframe === Timeframe.FOUR_HOURS) {
    return hour % 4 === 0 && minute === 0 && second < 10
  }

  if (timeframe === Timeframe.ONE_DAY) {
    return hour === 0 && minute === 0 && second < 10
  }

  return false
}

export function calculateCandlesElapsed(
  timeframe: Timeframe,
  startTime: Date,
  currentTime: Date
): number {
  const millisecondsDiff = currentTime.getTime() - startTime.getTime()
  const minutesDiff = millisecondsDiff / (1000 * 60)

  if (timeframe === Timeframe.ONE_HOUR) {
    return Math.floor(minutesDiff / 60)
  }

  if (timeframe === Timeframe.FOUR_HOURS) {
    return Math.floor(minutesDiff / 240)
  }

  if (timeframe === Timeframe.ONE_DAY) {
    return Math.floor(minutesDiff / 1440)
  }

  return 0
}

export function getNextCandleCloseTime(timeframe: Timeframe, currentTime: Date): Date {
  const next = new Date(currentTime)

  if (timeframe === Timeframe.ONE_HOUR) {
    next.setUTCMinutes(0, 0, 0)
    next.setUTCHours(next.getUTCHours() + 1)

    return next
  }

  if (timeframe === Timeframe.FOUR_HOURS) {
    next.setUTCMinutes(0, 0, 0)
    const currentHour = next.getUTCHours()
    const nextFourHourMark = Math.ceil((currentHour + 1) / 4) * 4

    next.setUTCHours(nextFourHourMark)

    return next
  }

  if (timeframe === Timeframe.ONE_DAY) {
    next.setUTCHours(0, 0, 0, 0)
    next.setUTCDate(next.getUTCDate() + 1)

    return next
  }

  return next
}

export function getCandleOpenTime(timeframe: Timeframe, currentTime: Date): Date {
  const open = new Date(currentTime)

  if (timeframe === Timeframe.ONE_HOUR) {
    open.setUTCMinutes(0, 0, 0)

    return open
  }

  if (timeframe === Timeframe.FOUR_HOURS) {
    open.setUTCMinutes(0, 0, 0)
    const currentHour = open.getUTCHours()
    const fourHourMark = Math.floor(currentHour / 4) * 4

    open.setUTCHours(fourHourMark)

    return open
  }

  if (timeframe === Timeframe.ONE_DAY) {
    open.setUTCHours(0, 0, 0, 0)

    return open
  }

  return open
}

export function getMinutesSince(timestamp: string | Date): number {
  const start = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()

  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
}

export function getHoursSince(timestamp: string | Date): number {
  const start = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()

  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60))
}

export function getTimeframeMinutes(timeframe: Timeframe): number {
  switch (timeframe) {
    case Timeframe.ONE_HOUR:
      return 60
    case Timeframe.FOUR_HOURS:
      return 240
    case Timeframe.ONE_DAY:
      return 1440
    default:
      return 60
  }
}
