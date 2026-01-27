'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireWorkspaceContext, verifyClientAccess } from '@/lib/workspace'
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  type CreateFollowUpInput,
  type UpdateFollowUpInput,
} from '@/lib/validations'
import type { ActionResult } from './clients'

export async function getFollowUps(clientId?: string) {
  const ctx = await requireWorkspaceContext()

  const where: { workspaceId: string; clientId?: string } = {
    workspaceId: ctx.workspaceId,
  }

  if (clientId) {
    // Verify client access
    const client = await verifyClientAccess(clientId, ctx.workspaceId)
    if (!client) {
      return []
    }
    where.clientId = clientId
  }

  const followUps = await prisma.followUp.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  return followUps
}

export async function createFollowUp(
  input: CreateFollowUpInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireWorkspaceContext()

    const parsed = createFollowUpSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' }
    }

    // Verify client access
    const client = await verifyClientAccess(parsed.data.clientId, ctx.workspaceId)
    if (!client) {
      return { success: false, error: 'Client not found' }
    }

    const followUp = await prisma.followUp.create({
      data: {
        ...parsed.data,
        workspaceId: ctx.workspaceId,
      },
    })

    revalidatePath(`/app/clients/${parsed.data.clientId}`)
    revalidatePath('/app/todo')
    return { success: true, data: { id: followUp.id } }
  } catch (error) {
    console.error('Create follow-up error:', error)
    return { success: false, error: 'Failed to create follow-up' }
  }
}

export async function updateFollowUp(
  id: string,
  input: UpdateFollowUpInput
): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceContext()

    // Verify the follow-up belongs to the workspace
    const existing = await prisma.followUp.findFirst({
      where: {
        id,
        workspaceId: ctx.workspaceId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Follow-up not found' }
    }

    const parsed = updateFollowUpSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' }
    }

    await prisma.followUp.update({
      where: { id },
      data: parsed.data,
    })

    revalidatePath(`/app/clients/${existing.clientId}`)
    revalidatePath('/app/todo')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Update follow-up error:', error)
    return { success: false, error: 'Failed to update follow-up' }
  }
}

export async function toggleFollowUpStatus(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceContext()

    const existing = await prisma.followUp.findFirst({
      where: {
        id,
        workspaceId: ctx.workspaceId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Follow-up not found' }
    }

    const newStatus = existing.status === 'OPEN' ? 'DONE' : 'OPEN'

    await prisma.followUp.update({
      where: { id },
      data: { status: newStatus },
    })

    revalidatePath(`/app/clients/${existing.clientId}`)
    revalidatePath('/app/todo')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Toggle follow-up status error:', error)
    return { success: false, error: 'Failed to update follow-up' }
  }
}

export async function deleteFollowUp(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceContext()

    const existing = await prisma.followUp.findFirst({
      where: {
        id,
        workspaceId: ctx.workspaceId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Follow-up not found' }
    }

    await prisma.followUp.delete({
      where: { id },
    })

    revalidatePath(`/app/clients/${existing.clientId}`)
    revalidatePath('/app/todo')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete follow-up error:', error)
    return { success: false, error: 'Failed to delete follow-up' }
  }
}
