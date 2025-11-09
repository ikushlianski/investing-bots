import { z } from 'zod'

const MIN_SESSION_SECRET_LENGTH = 32

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  SESSION_SECRET: z
    .string()
    .min(
      MIN_SESSION_SECRET_LENGTH,
      `SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters`
    ),
  INITIAL_USER_EMAIL: z.string().default('admin@botbox.local'),
  INITIAL_USER_PASSWORD: z.string().optional(),
  INITIAL_USER_NAME: z.string().optional(),
  BINANCE_API_KEY: z.string().optional(),
  BINANCE_API_SECRET: z.string().optional(),
  BYBIT_API_KEY: z.string().optional(),
  BYBIT_API_SECRET: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

let cachedEnv: Env | undefined

const getRawEnv = (): Record<string, string | undefined> => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env as Record<string, string | undefined>
  }

  return {}
}

const validateEnv = (rawEnv: Record<string, string | undefined>): Env => {
  try {
    return envSchema.parse(rawEnv)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')

      throw new Error(`Environment validation failed:\n${issues}`)
    }

    throw error
  }
}

export const getEnv = (): Env => {
  if (typeof window !== 'undefined') {
    throw new Error('getEnv() cannot be called on the client side')
  }

  if (cachedEnv) {
    return cachedEnv
  }

  const rawEnv = getRawEnv()

  cachedEnv = validateEnv(rawEnv)

  return cachedEnv
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const validatedEnv = getEnv()

    return validatedEnv[prop as keyof Env]
  },
})
