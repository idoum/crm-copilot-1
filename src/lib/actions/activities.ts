'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireWorkspaceContext, verifyClientAccess } from '@/lib/workspace'
import {
  createActivitySchema,
  type CreateActivityInput,
} from '@/lib/validations'
import type { ActionResult } from './clients'

export async function getActivities(clientId: string) {
  const ctx = await requireWorkspaceContext()

  // Verify client access
  const client = await verifyClientAccess(clientId, ctx.workspaceId)
  if (!client) {
    return []
  }

  const activities = await prisma.activity.findMany({
    where: {
      clientId,
      workspaceId: ctx.workspaceId,
    },
    orderBy: { occurredAt: 'desc' },
  })

  return activities
}

export async function createActivity(
  input: CreateActivityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireWorkspaceContext()

    const parsed = createActivitySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' }
    }

    // Verify client access
    const client = await verifyClientAccess(parsed.data.clientId, ctx.workspaceId)
    if (!client) {
      return { success: false, error: 'Client not found' }
    }

    const activity = await prisma.activity.create({
      data: {
        ...parsed.data,
        occurredAt: parsed.data.occurredAt || new Date(),
        workspaceId: ctx.workspaceId,
      },
    })

    revalidatePath(`/app/clients/${parsed.data.clientId}`)
    return { success: true, data: { id: activity.id } }
  } catch (error) {
    console.error('Create activity error:', error)
    return { success: false, error: 'Failed to create activity' }
  }
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceContext()

    // Verify the activity belongs to the workspace
    const activity = await prisma.activity.findFirst({
      where: {
        id,
        workspaceId: ctx.workspaceId,
      },
    })

    if (!activity) {
      return { success: false, error: 'Activity not found' }
    }

    await prisma.activity.delete({
      where: { id },
    })

    revalidatePath(`/app/clients/${activity.clientId}`)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete activity error:', error)
    return { success: false, error: 'Failed to delete activity' }
  }
}
