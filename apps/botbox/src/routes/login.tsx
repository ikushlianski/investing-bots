import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { getCurrentUserFn, loginFn } from '../server/auth'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const emailSchema = z.string().email('Invalid email format')

const searchSchema = z
  .object({
    redirect: z.string().optional(),
  })
  .transform((value) => ({
    redirect:
      value.redirect && value.redirect.startsWith('/')
        ? value.redirect
        : undefined,
  }))

type SearchParams = z.infer<typeof searchSchema>

export const Route = createFileRoute('/login')({
  validateSearch: (search: SearchParams) => searchSchema.parse(search),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()

    if (user) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: LoginPage,
})

type LoginResponse =
  | {
      success: false
      error: string
    }
  | undefined

function LoginPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [website, setWebsite] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    let isValid = true

    try {
      emailSchema.parse(email)
      setEmailError(null)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setEmailError(err.issues[0]?.message ?? 'Invalid email')
        isValid = false
      }
    }

    try {
      passwordSchema.parse(password)
      setPasswordError(null)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setPasswordError(err.issues[0]?.message ?? 'Invalid password')
        isValid = false
      }
    }

    return isValid
  }

  const attemptLogin = async () => {
    setError(null)
    setEmailError(null)
    setPasswordError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = (await loginFn({
        data: {
          email,
          password,
          website,
          redirectTo: search.redirect,
        },
      })) as LoginResponse

      if (response?.success === false) {
        setError(response.error)
        setIsSubmitting(false)
      }
    } catch (error) {
      if (error instanceof Response) {
        await navigate({ to: '/dashboard' })

        return
      }

      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Botbox</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage trading strategies securely.
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()

            if (isSubmitting) {
              return
            }

            void attemptLogin()
          }}
        >
          <div className="space-y-4">
            <input
              type="text"
              name="website"
              className="r8gkd3"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(event) => {
                setWebsite(event.target.value)
              }}
            />

            <label className="block text-left text-sm font-medium text-slate-200">
              Email
              <input
                className={`mt-1 w-full rounded-lg border px-4 py-3 text-sm text-white outline-none transition ${
                  emailError
                    ? 'border-red-500 bg-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/40'
                    : 'border-slate-700 bg-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40'
                }`}
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError(null)
                  setEmailError(null)
                }}
                onBlur={() => {
                  try {
                    emailSchema.parse(email)
                    setEmailError(null)
                  } catch (err) {
                    if (err instanceof z.ZodError) {
                      setEmailError(err.issues[0]?.message ?? 'Invalid email')
                    }
                  }
                }}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-400">{emailError}</p>
              )}
            </label>

            <label className="block text-left text-sm font-medium text-slate-200">
              Password
              <input
                className={`mt-1 w-full rounded-lg border px-4 py-3 text-sm text-white outline-none transition ${
                  passwordError
                    ? 'border-red-500 bg-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/40'
                    : 'border-slate-700 bg-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40'
                }`}
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError(null)
                  setPasswordError(null)
                }}
                onBlur={() => {
                  try {
                    passwordSchema.parse(password)
                    setPasswordError(null)
                  } catch (err) {
                    if (err instanceof z.ZodError) {
                      setPasswordError(
                        err.issues[0]?.message ?? 'Invalid password'
                      )
                    }
                  }
                }}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              {passwordError && (
                <p className="mt-1 text-xs text-red-400">{passwordError}</p>
              )}
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/60 bg-red-900/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            className="flex w-full items-center justify-center rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-950 disabled:text-slate-500"
            type="submit"
            disabled={isSubmitting || !!emailError || !!passwordError}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
