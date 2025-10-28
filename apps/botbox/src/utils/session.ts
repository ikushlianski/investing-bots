import { useSession } from '@tanstack/react-start/server'
import { env } from '../config/env'
import type { SessionData } from '../types/session'

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
const SESSION_NAME = 'botbox-session'

export const useAppSession = () => {
  return useSession<SessionData>({
    name: SESSION_NAME,
    password: env.SESSION_SECRET,
    cookie: {
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: SESSION_TTL_SECONDS,
    },
  })
}
