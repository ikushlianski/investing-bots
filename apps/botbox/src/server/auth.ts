import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '../db/client'
import { users } from '../db/schema'
import { useAppSession } from '../utils/session'
import { verifyPassword } from '../utils/password'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  redirectTo: z.string().optional(),
})

const normalizeEmail = (email: string) => {
  return email.trim().toLowerCase()
}

const resolveRedirectTarget = (redirectTo?: string) => {
  if (!redirectTo) {
    return '/dashboard'
  }

  if (!redirectTo.startsWith('/')) {
    return '/dashboard'
  }

  return redirectTo
}

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(loginSchema)
  .handler(async ({ data }) => {
    const db = await getDb()
    const session = await useAppSession()

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizeEmail(data.email)),
    })

    if (!user) {
      return {
        success: false as const,
        error: 'Invalid email or password',
      }
    }

    const passwordValid = await verifyPassword(
      data.password,
      user.hashedPassword
    )

    if (!passwordValid) {
      return {
        success: false as const,
        error: 'Invalid email or password',
      }
    }

    await session.update({
      userId: user.id,
      userEmail: user.email,
    })

    throw redirect({
      to: resolveRedirectTarget(data.redirectTo),
    })
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()

  await session.clear()

  throw redirect({
    to: '/login',
    search: { redirect: undefined },
  })
})

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await useAppSession()

    if (!session.data.userId) {
      return null
    }

    const db = await getDb()
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.data.userId),
    })

    if (!user) {
      await session.clear()

      return null
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    }
  }
)
