import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentUserFn } from '../server/auth'
import Header from '../components/Header'

type BeforeLoadContext = {
  location: {
    href: string
  }
}

type UserContext = {
  user: {
    id: number
    email: string
    createdAt: string
  }
}

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }: BeforeLoadContext) => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    return {
      user,
    }
  },
  component: ProtectedRoot,
})

function ProtectedRoot() {
  const context = Route.useRouteContext() as UserContext

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header userEmail={context.user.email} />
      <Outlet />
    </div>
  )
}
