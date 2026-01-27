'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { env, changePwdRateLimitWindowMs } from '@/lib/env'

// Rate limiting storage (in-memory, resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(userId)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + changePwdRateLimitWindowMs })
    return true
  }

  if (record.count >= env.CHANGE_PWD_RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export type ChangePasswordResult = {
  success: true
} | {
  success: false
  error: 'unauthorized' | 'noPassword' | 'wrongPassword' | 'validationError' | 'rateLimited' | 'serverError'
  message?: string
}

export async function changePassword(formData: FormData): Promise<ChangePasswordResult> {
  try {
    // Require authentication
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'unauthorized',
      }
    }

    const userId = session.user.id

    // Check rate limit
    if (!checkRateLimit(userId)) {
      console.warn(`Rate limit exceeded for password change: ${userId}`)
      return {
        success: false,
        error: 'rateLimited',
      }
    }

    // Extract and validate form data
    const rawData = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmNewPassword: formData.get('confirmNewPassword') as string,
    }

    const validation = changePasswordSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        error: 'validationError',
        message: validation.error.issues[0]?.message,
      }
    }

    const { currentPassword, newPassword } = validation.data

    // Fetch current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    })

    if (!user) {
      return {
        success: false,
        error: 'unauthorized',
      }
    }

    // Check if user has a password (OAuth-only users don't)
    if (!user.password) {
      return {
        success: false,
        error: 'noPassword',
      }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: 'wrongPassword',
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS)

    // Update password and invalidate any existing password reset tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      // Invalidate all existing password reset tokens for this user
      prisma.passwordResetToken.updateMany({
        where: {
          userId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return {
      success: false,
      error: 'serverError',
    }
  }
}
