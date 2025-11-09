import { eq } from 'drizzle-orm'
import { hashPassword } from '../src/utils/password'
import { users } from '../src/db/schema'
import { env } from '../src/config/env'
import type { SeedDatabase } from './seed'

export const seedUser = async (db: SeedDatabase) => {
  const email = env.INITIAL_USER_EMAIL
  const password = env.INITIAL_USER_PASSWORD
  const name = env.INITIAL_USER_NAME

  if (!password) {
    console.error(
      'Error: INITIAL_USER_PASSWORD environment variable is required'
    )
    throw new Error('INITIAL_USER_PASSWORD environment variable is required')
  }

  const hashedPassword = await hashPassword(password)

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existingUser) {
    console.log(
      `User with email ${email} already exists. Deleting and recreating...`
    )
    await db.delete(users).where(eq(users.id, existingUser.id))
  }

  await db.insert(users).values({
    email,
    hashedPassword,
    name: name || null,
  })

  console.log(`Successfully created user:`)
  console.log(`  Email: ${email}`)

  if (name) {
    console.log(`  Name: ${name}`)
  }

  console.log(`  Password: [hidden]`)
}
