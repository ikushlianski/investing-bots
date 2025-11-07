import { eq, and, sql } from "drizzle-orm";
import type { DrizzleDatabase } from "../database";

export interface RiskContext {
  dailyLossPercent: number;
  openPositions: number;
  correlatedExposureCount: number;
  openRiskPercent: number;
  todos: { id: string; description: string }[];
}

export async function collectRiskContext(
  db: DrizzleDatabase,
  positionTable: unknown,
  tradeTable: unknown,
  instrumentId: number
): Promise<RiskContext> {
  const todos: { id: string; description: string }[] = [];

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const openPositionsResult = await db
    .select({
      count: sql<number>`count(*)`.as("count"),
    })
    .from(positionTable)
    .where(eq((positionTable as { status: unknown }).status, "open"));

  const openPositions = openPositionsResult[0]?.count ?? 0;

  const dailyLossResult = await db
    .select({
      totalLoss: sql<number>`sum(${
        (tradeTable as { realizedPnl: unknown }).realizedPnl
      })`.as("total_loss"),
    })
    .from(tradeTable)
    .where(
      and(
        sql`${
          (tradeTable as { entryTime: unknown }).entryTime
        } >= ${today.toISOString()}`,
        sql`${(tradeTable as { realizedPnl: unknown }).realizedPnl} < 0`
      )
    );

  const dailyLoss = dailyLossResult[0]?.totalLoss ?? 0;

  todos.push({
    id: "TODO_CORRELATION_MATRIX",
    description:
      "Integrate correlation matrix to compute correlatedExposureCount dynamically",
  });

  todos.push({
    id: "TODO_DAILY_LOSS_CALCULATION",
    description: "Calculate daily loss from account balance and trades",
  });

  todos.push({
    id: "TODO_OPEN_RISK_CALCULATION",
    description: "Calculate open risk percent from open positions",
  });

  return {
    dailyLossPercent: 0,
    openPositions,
    correlatedExposureCount: 0,
    openRiskPercent: 0,
    todos,
  };
}
