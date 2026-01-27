import { z } from 'zod'

/**
 * Environment variable loader with Zod validation.
 * Fails fast in production if required variables are missing.
 */

const isProduction = process.env.NODE_ENV === 'production'

// Schema for tunables (with defaults)
const tunablesSchema = z.object({
  INVITE_EXPIRY_DAYS: z.coerce.number().positive().default(7),
  PASSWORD_RESET_EXPIRY_MINUTES: z.coerce.number().positive().default(30),
  RESET_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(15),
  RESET_RATE_LIMIT_MAX: z.coerce.number().positive().default(5),
  CHANGE_PWD_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(10),
  CHANGE_PWD_RATE_LIMIT_MAX: z.coerce.number().positive().default(5),
  BCRYPT_ROUNDS: z.coerce.number().min(4).max(31).default(10),
  WORKSPACE_COOKIE_MAX_AGE_DAYS: z.coerce.number().positive().default(365),
})

// Schema for required env vars (no defaults in production)
const requiredSchema = z.object({
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  APP_URL: z.string().url('APP_URL must be a valid URL'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false').transform(v => v === 'true'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email'),
})

// Development-only schema (allows defaults for URLs)
const devRequiredSchema = z.object({
  AUTH_SECRET: z.string().default('dev-secret-change-me-in-production'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false').transform(v => v === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@localhost'),
})

// Combined schema based on environment
const envSchema = isProduction
  ? requiredSchema.merge(tunablesSchema)
  : devRequiredSchema.merge(tunablesSchema)

type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse({
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    APP_URL: process.env.APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    // Tunables
    INVITE_EXPIRY_DAYS: process.env.INVITE_EXPIRY_DAYS,
    PASSWORD_RESET_EXPIRY_MINUTES: process.env.PASSWORD_RESET_EXPIRY_MINUTES,
    RESET_RATE_LIMIT_WINDOW_MINUTES: process.env.RESET_RATE_LIMIT_WINDOW_MINUTES,
    RESET_RATE_LIMIT_MAX: process.env.RESET_RATE_LIMIT_MAX,
    CHANGE_PWD_RATE_LIMIT_WINDOW_MINUTES: process.env.CHANGE_PWD_RATE_LIMIT_WINDOW_MINUTES,
    CHANGE_PWD_RATE_LIMIT_MAX: process.env.CHANGE_PWD_RATE_LIMIT_MAX,
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
    WORKSPACE_COOKIE_MAX_AGE_DAYS: process.env.WORKSPACE_COOKIE_MAX_AGE_DAYS,
  })

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    const message = `\n❌ Environment validation failed:\n${errors}\n`

    if (isProduction) {
      throw new Error(message)
    } else {
      console.warn(message)
      // Return partial result with defaults for dev
      return result.data as unknown as Env
    }
  }

  return result.data
}

// Export validated environment
export const env = loadEnv()

// Computed values for convenience
export const isSecureCookie = isProduction
export const workspaceCookieMaxAge = env.WORKSPACE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
export const passwordResetExpiryMs = env.PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000
export const resetRateLimitWindowMs = env.RESET_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
export const changePwdRateLimitWindowMs = env.CHANGE_PWD_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
