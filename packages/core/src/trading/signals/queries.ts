import { eq, and, sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
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
  signalTable: PgTable,
  setupTable: PgTable
): Promise<SignalForRevalidation[]> {
  const result = await db
    .select()
    .from(signalTable)
    .innerJoin(
      setupTable,
      eq(
        (signalTable as any).setupId,
        (setupTable as any).id
      )
    )
    .where(
      and(
        eq((signalTable as any).stillValid, true),
        eq((signalTable as any).requiresRecheck, true),
        sql`${(setupTable as any).state} IN ('FORMING', 'ACTIVE')`
      )
    )

  return result.map((row: any) => {
    const signalData = row[Object.keys(row)[0]] as SignalRow
    const setupData = row[Object.keys(row)[1]] as { instrumentId: number }

    return {
      id: signalData.id,
      setupId: signalData.setupId,
      signalType: signalData.signalType,
      firedAt: signalData.firedAt,
      value: signalData.value,
      detectedOnTimeframe: signalData.detectedOnTimeframe,
      stillValid: signalData.stillValid,
      requiresRecheck: signalData.requiresRecheck,
      instrumentId: setupData.instrumentId,
    }
  })
}

export async function invalidateSignal(
  db: DrizzleDatabase,
  signalTable: PgTable,
  signalId: number
): Promise<void> {
  await db
    .update(signalTable)
    .set({
      stillValid: false,
      invalidatedAt: new Date().toISOString(),
    } as Record<string, any>)
    .where(eq((signalTable as any).id, signalId))
}

export async function updateSignalRecheckTimestamp(
  db: DrizzleDatabase,
  signalTable: PgTable,
  signalId: number
): Promise<void> {
  await db
    .update(signalTable)
    .set({
      lastRecheckedAt: new Date().toISOString(),
    } as Record<string, any>)
    .where(eq((signalTable as any).id, signalId))
}

export async function countValidSignals(
  db: DrizzleDatabase,
  signalTable: PgTable,
  setupId: number
): Promise<number> {
  const result = (await db
    .select({
      count: sql<number>`count(*)`.as('count'),
    })
    .from(signalTable)
    .where(
      and(
        eq((signalTable as any).setupId, setupId),
        eq((signalTable as any).stillValid, true)
      )
    )
    .all()) as { count: number }[]

  return result[0]?.count ?? 0
}

