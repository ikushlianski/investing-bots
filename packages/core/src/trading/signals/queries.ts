import { eq, and, sql } from 'drizzle-orm'
import type { SignalType } from '../types'
import type { DrizzleDatabase } from '../database'

export interface SignalRow {
  id: number
  setupId: number
  signalType: string
  firedAt: string
  value: string | null
  detectedOnTimeframe: string
  stillValid: boolean
  requiresRecheck: boolean
}

export interface SignalForRevalidation extends SignalRow {
  instrumentId: number
}

export async function getSignalsForRevalidation(
  db: DrizzleDatabase,
  signalTable: unknown,
  setupTable: unknown
): Promise<SignalForRevalidation[]> {
  const result = await db
    .select()
    .from(signalTable)
    .innerJoin(
      setupTable,
      eq(
        (signalTable as { setupId: unknown }).setupId,
        (setupTable as { id: unknown }).id
      )
    )
    .where(
      and(
        eq((signalTable as { stillValid: unknown }).stillValid, true),
        eq((signalTable as { requiresRecheck: unknown }).requiresRecheck, true),
        sql`${(setupTable as { state: unknown }).state} IN ('FORMING', 'ACTIVE')`
      )
    )

  return result.map((row) => ({
    id: (row[Object.keys(row)[0]] as SignalRow).id,
    setupId: (row[Object.keys(row)[0]] as SignalRow).setupId,
    signalType: (row[Object.keys(row)[0]] as SignalRow).signalType,
    firedAt: (row[Object.keys(row)[0]] as SignalRow).firedAt,
    value: (row[Object.keys(row)[0]] as SignalRow).value,
    detectedOnTimeframe: (row[Object.keys(row)[0]] as SignalRow).detectedOnTimeframe,
    stillValid: (row[Object.keys(row)[0]] as SignalRow).stillValid,
    requiresRecheck: (row[Object.keys(row)[0]] as SignalRow).requiresRecheck,
    instrumentId: (row[Object.keys(row)[1]] as { instrumentId: number }).instrumentId,
  }))
}

export async function invalidateSignal(
  db: DrizzleDatabase,
  signalTable: unknown,
  signalId: number
): Promise<void> {
  await db
    .update(signalTable)
    .set({
      stillValid: false,
      invalidatedAt: new Date().toISOString(),
    } as Record<string, unknown>)
    .where(eq((signalTable as { id: unknown }).id, signalId))
    .run()
}

export async function updateSignalRecheckTimestamp(
  db: DrizzleDatabase,
  signalTable: unknown,
  signalId: number
): Promise<void> {
  await db
    .update(signalTable)
    .set({
      lastRecheckedAt: new Date().toISOString(),
    } as Record<string, unknown>)
    .where(eq((signalTable as { id: unknown }).id, signalId))
    .run()
}

export async function countValidSignals(
  db: DrizzleDatabase,
  signalTable: unknown,
  setupId: number
): Promise<number> {
  const result = (await db
    .select({
      count: sql<number>`count(*)`.as('count'),
    })
    .from(signalTable)
    .where(
      and(
        eq((signalTable as { setupId: unknown }).setupId, setupId),
        eq((signalTable as { stillValid: unknown }).stillValid, true)
      )
    )
    .all()) as { count: number }[]

  return result[0]?.count ?? 0
}

