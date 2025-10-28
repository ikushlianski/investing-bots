import { Link, useNavigate } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { logoutFn } from '../server/auth'

type HeaderProps = {
  userEmail: string
}

export default function Header({ userEmail }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutFn()
    } catch (error) {
      if (error instanceof Response) {
        await navigate({ to: '/login', search: { redirect: undefined } })

        return
      }

      throw error
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center rounded-lg border border-transparent bg-slate-800/80 p-2 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold text-white"
          >
            <span>Botbox</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
            activeProps={{
              className: 'text-sm font-semibold text-white',
            }}
          >
            Dashboard
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <span className="text-sm text-slate-400">{userEmail}</span>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleLogout()
            }}
          >
            <button className="rounded-lg border border-red-500/40 bg-red-600/90 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-800 bg-slate-950/95 backdrop-blur transition-transform duration-200 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <span className="text-base font-semibold text-white">Navigation</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-transparent p-2 text-slate-200 transition hover:border-slate-700 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-5 py-6">
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white"
            activeProps={{
              className:
                'rounded-lg border border-cyan-500/60 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-white',
            }}
          >
            Dashboard
          </Link>
          <div className="rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
            Signed in as {userEmail}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleLogout()
            }}
          >
            <button className="flex w-full items-center justify-center rounded-lg border border-red-500/50 bg-red-600/90 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
