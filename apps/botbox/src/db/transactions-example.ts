import { getDb } from './client'
import { users } from './schema/users.schema'
import { bots } from './schema/bots.schema'
import { exchanges } from './schema/exchanges.schema'

export async function exampleTransaction() {
  const db = getDb()

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ email: 'test@example.com', hashedPassword: 'hash' })
    await tx
      .insert(bots)
      .values({ userId: 1, name: 'Bot 1', strategyVersionId: 1 })
  })
}

export async function exampleNestedTransaction() {
  const db = getDb()

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ email: 'user@example.com', hashedPassword: 'hash' })

    await tx.transaction(async (tx2) => {
      await tx2
        .insert(exchanges)
        .values({ name: 'Binance', apiUrl: 'https://api.binance.com' })
    })
  })
}
