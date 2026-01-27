'use server'

import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations'
import { sendPasswordResetEmail } from '@/lib/email'
import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { normalizeEmail } from '@/lib/normalize'
import { env, resetRateLimitWindowMs, passwordResetExpiryMs } from '@/lib/env'

// Rate limiting storage (in-memory, resets on server restart)
// In production, use Redis or similar persistent store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + resetRateLimitWindowMs })
    return true
  }

  if (record.count >= env.RESET_RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// DEV-only debug info type
type DevDebugInfo = {
  sent: boolean
  reason?: 'user_not_found' | 'oauth_user' | 'smtp_failed' | 'rate_limited'
  error?: string
}

export type RequestPasswordResetResult = {
  success: true
  dev?: DevDebugInfo // Only present in DEV mode
} | {
  success: false
  error: 'validationError' | 'rateLimited' | 'serverError'
  message?: string
}

export async function requestPasswordReset(formData: FormData): Promise<RequestPasswordResetResult> {
  try {
    const rawData = {
      email: formData.get('email') as string,
    }

    // Validate input
    const validation = forgotPasswordSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        error: 'validationError',
        message: validation.error.issues[0]?.message,
      }
    }

    const { email } = validation.data
    const normalizedEmail = normalizeEmail(email)
    const isDev = process.env.NODE_ENV !== 'production'

    // Check rate limit
    if (!checkRateLimit(normalizedEmail)) {
      // Still return success to prevent enumeration
      // But log internally
      console.warn(`Rate limit exceeded for password reset: ${normalizedEmail}`)
      return isDev 
        ? { success: true, dev: { sent: false, reason: 'rate_limited' as const } }
        : { success: true }
    }

    // Find user (case-insensitive for SQLite)
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`)
      return isDev
        ? { success: true, dev: { sent: false, reason: 'user_not_found' as const } }
        : { success: true }
    }

    // User must have a password (credential-based account)
    if (!user.password) {
      // User signed up with OAuth, no password to reset
      console.log(`Password reset requested for OAuth user: ${normalizedEmail}`)
      return isDev
        ? { success: true, dev: { sent: false, reason: 'oauth_user' as const } }
        : { success: true }
    }

    // Invalidate all existing tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    // Generate new token
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + passwordResetExpiryMs)

    // Store hashed token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // Send email with raw token
    const emailSent = await sendPasswordResetEmail({
      to: user.email!,
      token: rawToken,
      userName: user.name,
    })

    if (!emailSent) {
      console.error(`Failed to send password reset email to: ${normalizedEmail}`)
      // Still return success to prevent enumeration
      return isDev
        ? { success: true, dev: { sent: false, reason: 'smtp_failed' as const, error: 'SMTP send failed' } }
        : { success: true }
    }

    return isDev
      ? { success: true, dev: { sent: true } }
      : { success: true }
  } catch (error) {
    console.error('Password reset request error:', error)
    return {
      success: false,
      error: 'serverError',
    }
  }
}

export type ResetPasswordResult = {
  success: true
} | {
  success: false
  error: 'validationError' | 'tokenInvalid' | 'serverError'
  message?: string
}

export async function resetPassword(formData: FormData): Promise<ResetPasswordResult> {
  try {
    const rawData = {
      token: formData.get('token') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    // Validate input
    const validation = resetPasswordSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        error: 'validationError',
        message: validation.error.issues[0]?.message,
      }
    }

    const { token, password } = validation.data

    // Hash the incoming token to compare with stored hash
    const tokenHash = hashToken(token)

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        user: true,
      },
    })

    if (!resetToken) {
      return {
        success: false,
        error: 'tokenInvalid',
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

    // Update user password and mark token as used (in transaction)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'serverError',
    }
  }
}

export async function resetPasswordAndRedirect(formData: FormData): Promise<void> {
  const result = await resetPassword(formData)
  
  if (result.success) {
    redirect('/login?message=password-updated')
  }
  
  // If there's an error, the result will be returned and handled by the form
  throw new Error(result.error)
}
