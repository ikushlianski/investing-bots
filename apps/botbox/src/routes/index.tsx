import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '../server/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()

    if (user) {
      throw redirect({
        to: '/dashboard',
        search: { redirect: undefined },
      }) as unknown as Error
    }

    throw redirect({
      to: '/login',
      search: { redirect: undefined },
    }) as unknown as Error
  },
  component: () => null,
})
