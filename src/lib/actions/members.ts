'use server'

import { prisma } from '@/lib/prisma'
import { requireWorkspaceContext, requireOwnerRole } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'

// ============================================
// DEACTIVATE MEMBER (remove membership)
// ============================================

export type DeactivateMemberResult = {
  success: true
} | {
  success: false
  error: 'unauthorized' | 'notFound' | 'cannotDeactivateSelf' | 'cannotDeactivateLastOwner' | 'serverError'
}

export async function deactivateMember(membershipId: string): Promise<DeactivateMemberResult> {
  try {
    const ctx = await requireWorkspaceContext()
    
    // Only OWNER can deactivate members
    await requireOwnerRole(ctx)

    // Find the membership to deactivate
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
      },
    })

    if (!membership || membership.workspaceId !== ctx.workspaceId) {
      return {
        success: false,
        error: 'notFound',
      }
    }

    // Prevent self-deactivation
    if (membership.userId === ctx.userId) {
      return {
        success: false,
        error: 'cannotDeactivateSelf',
      }
    }

    // If the member being deactivated is an OWNER, check if they're the last one
    if (membership.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: {
          workspaceId: ctx.workspaceId,
          role: 'OWNER',
        },
      })

      if (ownerCount <= 1) {
        return {
          success: false,
          error: 'cannotDeactivateLastOwner',
        }
      }
    }

    // Delete the membership (remove access)
    await prisma.membership.delete({
      where: { id: membershipId },
    })

    // If the deactivated user had this workspace selected, clear their selection
    if (membership.user.selectedWorkspaceId === ctx.workspaceId) {
      // Find another workspace for them, or set to null
      const anotherMembership = await prisma.membership.findFirst({
        where: { userId: membership.userId },
      })

      await prisma.user.update({
        where: { id: membership.userId },
        data: {
          selectedWorkspaceId: anotherMembership?.workspaceId || null,
        },
      })
    }

    revalidatePath('/app/settings')

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'Owner role required') {
      return { success: false, error: 'unauthorized' }
    }
    console.error('Deactivate member error:', error)
    return { success: false, error: 'serverError' }
  }
}
