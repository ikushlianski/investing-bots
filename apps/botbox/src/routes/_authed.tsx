import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentUserFn } from '../server/auth'
import Header from '../components/Header'

type User = {
  id: number
  email: string
  createdAt: string
}

type AuthedRouteContext = {
  user: User
}

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    return { user }
  },
  component: ProtectedRoot,
})

function ProtectedRoot() {
  const { user } = Route.useRouteContext() as AuthedRouteContext

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header userEmail={user.email} />
      <Outlet />
    </div>
  )
}
