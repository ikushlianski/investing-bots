import { eq, and, inArray, sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { SetupState } from './enums'
import type { DrizzleDatabase } from '../database'

export interface SetupRow {
  id: number
  instrumentId: number
  direction: 'LONG' | 'SHORT'
  entryZoneLow: string
  entryZoneHigh: string
  activatedAt: string | null
  contextRegimeId: number | null
  contextTimeframe: string | null
  state: string
  createdAt: string
  requiredConfirmations: number
  formingDurationMinutes: number
  entryTimeframe: string
  stopLoss: string | null
  takeProfit1: string | null
  takeProfit2: string | null
}

export interface SetupForInvalidation {
  id: number
  instrumentId: number
  direction: 'LONG' | 'SHORT'
  entryZoneLow: number
  entryZoneHigh: number
  activatedAt: string | null
  contextRegimeId: number | null
  contextTimeframe: string | null
}

export interface SetupForEvaluation {
  id: number
  instrumentId: number
  state: SetupState
  createdAt: string
  activatedAt: string | null
  entryZoneLow: number
  entryZoneHigh: number
  requiredConfirmations: number
  formingDurationMinutes: number
  direction: 'LONG' | 'SHORT'
  entryTimeframe: string
  stopLoss: number | null
  takeProfit1: number | null
  takeProfit2: number | null
  contextTimeframe: string | null
}

export async function getActiveSetupsForInvalidation(
  db: DrizzleDatabase,
  setupTable: PgTable
): Promise<SetupForInvalidation[]> {
  const result = (await db
    .select()
    .from(setupTable)
    .where(
      inArray(
        (setupTable as any).state,
        [SetupState.FORMING, SetupState.ACTIVE]
      )
    )
    .all()) as SetupRow[]

  return result.map((setup) => ({
    id: setup.id,
    instrumentId: setup.instrumentId,
    direction: setup.direction,
    entryZoneLow: parseFloat(setup.entryZoneLow),
    entryZoneHigh: parseFloat(setup.entryZoneHigh),
    activatedAt: setup.activatedAt,
    contextRegimeId: setup.contextRegimeId,
    contextTimeframe: setup.contextTimeframe,
  }))
}

export async function getActiveSetupsForEvaluation(
  db: DrizzleDatabase,
  setupTable: PgTable
): Promise<SetupForEvaluation[]> {
  const result = (await db
    .select()
    .from(setupTable)
    .where(
      inArray(
        (setupTable as any).state,
        [SetupState.FORMING, SetupState.ACTIVE]
      )
    )
    .all()) as SetupRow[]

  return result.map((setup) => ({
    id: setup.id,
    instrumentId: setup.instrumentId,
    state: setup.state as SetupState,
    createdAt: setup.createdAt,
    activatedAt: setup.activatedAt,
    entryZoneLow: parseFloat(setup.entryZoneLow),
    entryZoneHigh: parseFloat(setup.entryZoneHigh),
    requiredConfirmations: setup.requiredConfirmations,
    formingDurationMinutes: setup.formingDurationMinutes,
    direction: setup.direction,
    entryTimeframe: setup.entryTimeframe,
    stopLoss: setup.stopLoss ? parseFloat(setup.stopLoss) : null,
    takeProfit1: setup.takeProfit1 ? parseFloat(setup.takeProfit1) : null,
    takeProfit2: setup.takeProfit2 ? parseFloat(setup.takeProfit2) : null,
    contextTimeframe: setup.contextTimeframe,
  }))
}

export async function invalidateSetup(
  db: DrizzleDatabase,
  setupTable: PgTable,
  setupId: number,
  reason: string
): Promise<void> {
  await db
    .update(setupTable)
    .set({
      state: SetupState.INVALIDATED,
      invalidatedAt: new Date().toISOString(),
      invalidationReason: reason,
    } as Record<string, any>)
    .where(eq((setupTable as any).id, setupId))
}

export async function activateSetup(
  db: DrizzleDatabase,
  setupTable: PgTable,
  setupId: number
): Promise<void> {
  await db
    .update(setupTable)
    .set({
      state: SetupState.ACTIVE,
      activatedAt: new Date().toISOString(),
    } as Record<string, any>)
    .where(eq((setupTable as any).id, setupId))
}

export async function expireOldSetups(
  db: DrizzleDatabase,
  setupTable: PgTable,
  currentTime: Date
): Promise<void> {
  await db
    .update(setupTable)
    .set({
      state: SetupState.EXPIRED,
      invalidatedAt: currentTime.toISOString(),
    } as Record<string, any>)
    .where(
      and(
        inArray(
          (setupTable as any).state,
          [SetupState.FORMING, SetupState.ACTIVE]
        ),
        sql`${(setupTable as any).expiresAt} < ${currentTime.toISOString()}`
      )
    )
}

export async function countActiveSetups(
  db: DrizzleDatabase,
  setupTable: PgTable
): Promise<number> {
  const result = (await db
    .select({
      count: sql<number>`count(*)`.as('count'),
    })
    .from(setupTable)
    .where(
      inArray(
        (setupTable as any).state,
        [SetupState.FORMING, SetupState.ACTIVE]
      )
    )
    .all()) as { count: number }[]

  return result[0]?.count ?? 0
}

