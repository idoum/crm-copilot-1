'use server'

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requireWorkspaceContext, requireOwnerRole } from '@/lib/workspace'
import { generateInviteSchema, acceptInviteSchema } from '@/lib/validations'
import { setCurrentWorkspace } from './workspace'
import { env } from '@/lib/env'

/**
 * Hash a token using SHA-256
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ============================================
// GENERATE INVITE
// ============================================

export type GenerateInviteResult = {
  success: true
  inviteLink: string
  expiresAt: Date
} | {
  success: false
  error: 'unauthorized' | 'validationError' | 'serverError'
  message?: string
}

export async function generateInvite(formData: FormData): Promise<GenerateInviteResult> {
  try {
    const ctx = await requireWorkspaceContext()
    
    // Only OWNER can generate invites
    await requireOwnerRole(ctx)

    const rawData = {
      workspaceId: formData.get('workspaceId') as string,
      role: (formData.get('role') as string) || 'MEMBER',
    }

    const validation = generateInviteSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        error: 'validationError',
        message: validation.error.issues[0]?.message,
      }
    }

    const { workspaceId, role } = validation.data

    // Verify the workspace matches the current context
    if (workspaceId !== ctx.workspaceId) {
      return {
        success: false,
        error: 'unauthorized',
      }
    }

    // Generate token
    const rawToken = generateToken()
    const tokenHash = hashToken(rawToken)

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + env.INVITE_EXPIRY_DAYS)

    // Create invitation
    await prisma.invitation.create({
      data: {
        workspaceId,
        tokenHash,
        role,
        createdByUserId: ctx.userId,
        expiresAt,
      },
    })

    // Build the invite link
    const inviteLink = `${env.NEXTAUTH_URL}/accept-invite?token=${rawToken}`

    return {
      success: true,
      inviteLink,
      expiresAt,
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Owner role required') {
      return {
        success: false,
        error: 'unauthorized',
      }
    }
    console.error('Generate invite error:', error)
    return {
      success: false,
      error: 'serverError',
    }
  }
}

// ============================================
// VALIDATE INVITE (for display purposes)
// ============================================

export type ValidateInviteResult = {
  valid: true
  workspaceName: string
  workspaceId: string
  role: string
} | {
  valid: false
  error: 'invalid' | 'expired' | 'used' | 'revoked'
}

export async function validateInvite(token: string): Promise<ValidateInviteResult> {
  try {
    const validation = acceptInviteSchema.safeParse({ token })
    if (!validation.success) {
      return { valid: false, error: 'invalid' }
    }

    const tokenHash = hashToken(token)

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!invitation) {
      return { valid: false, error: 'invalid' }
    }

    if (invitation.revokedAt) {
      return { valid: false, error: 'revoked' }
    }

    if (invitation.acceptedAt) {
      return { valid: false, error: 'used' }
    }

    if (new Date() > invitation.expiresAt) {
      return { valid: false, error: 'expired' }
    }

    return {
      valid: true,
      workspaceName: invitation.workspace.name,
      workspaceId: invitation.workspace.id,
      role: invitation.role,
    }
  } catch (error) {
    console.error('Validate invite error:', error)
    return { valid: false, error: 'invalid' }
  }
}

// ============================================
// ACCEPT INVITE
// ============================================

export type AcceptInviteResult = {
  success: true
  workspaceId: string
  alreadyMember: boolean
} | {
  success: false
  error: 'invalid' | 'expired' | 'used' | 'revoked' | 'unauthorized' | 'serverError'
}

export async function acceptInvite(token: string): Promise<AcceptInviteResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'unauthorized',
      }
    }

    const userId = session.user.id

    const validation = acceptInviteSchema.safeParse({ token })
    if (!validation.success) {
      return { success: false, error: 'invalid' }
    }

    const tokenHash = hashToken(token)

    // Use a transaction for safety
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { tokenHash },
        include: {
          workspace: true,
        },
      })

      if (!invitation) {
        return { success: false as const, error: 'invalid' as const }
      }

      if (invitation.revokedAt) {
        return { success: false as const, error: 'revoked' as const }
      }

      if (invitation.acceptedAt) {
        return { success: false as const, error: 'used' as const }
      }

      if (new Date() > invitation.expiresAt) {
        return { success: false as const, error: 'expired' as const }
      }

      // Check if user is already a member
      const existingMembership = await tx.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: invitation.workspaceId,
          },
        },
      })

      let alreadyMember = false

      if (existingMembership) {
        // User is already a member, just mark invite as used
        alreadyMember = true
      } else {
        // Create membership
        await tx.membership.create({
          data: {
            userId,
            workspaceId: invitation.workspaceId,
            role: invitation.role,
          },
        })
      }

      // Mark invitation as used
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          acceptedByUserId: userId,
        },
      })

      // Update user's selected workspace
      await tx.user.update({
        where: { id: userId },
        data: { selectedWorkspaceId: invitation.workspaceId },
      })

      return {
        success: true as const,
        workspaceId: invitation.workspaceId,
        alreadyMember,
      }
    })

    // Also set the cookie for workspace selection
    if (result.success) {
      await setCurrentWorkspace(result.workspaceId)
    }

    return result
  } catch (error) {
    console.error('Accept invite error:', error)
    return {
      success: false,
      error: 'serverError',
    }
  }
}

// ============================================
// REVOKE INVITE (Optional - nice to have)
// ============================================

export type RevokeInviteResult = {
  success: true
} | {
  success: false
  error: 'unauthorized' | 'notFound' | 'serverError'
}

export async function revokeInvite(inviteId: string): Promise<RevokeInviteResult> {
  try {
    const ctx = await requireWorkspaceContext()
    await requireOwnerRole(ctx)

    const invitation = await prisma.invitation.findUnique({
      where: { id: inviteId },
    })

    if (!invitation || invitation.workspaceId !== ctx.workspaceId) {
      return {
        success: false,
        error: 'notFound',
      }
    }

    await prisma.invitation.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    })

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'Owner role required') {
      return { success: false, error: 'unauthorized' }
    }
    console.error('Revoke invite error:', error)
    return { success: false, error: 'serverError' }
  }
}
