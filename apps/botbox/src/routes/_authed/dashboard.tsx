import { createFileRoute } from '@tanstack/react-router'
import { Route as AuthedRoute } from '../_authed'

export const Route = createFileRoute('/_authed/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = AuthedRoute.useRouteContext()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm uppercase text-slate-500">Signed in as</span>
          <span className="text-2xl font-semibold text-white">
            {user.email}
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Welcome back to Botbox. Access dashboards, manage strategies, and
          review portfolio performance from the navigation menu.
        </p>
      </section>
    </main>
  )
}
