'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireWorkspaceContext, verifyClientAccess } from '@/lib/workspace'
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from '@/lib/validations'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type ClientRow = {
  id: string
  workspaceId: string
  name: string
  email: string | null
  phone: string | null
  status: string
  tags: string
  note: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getClients(options?: {
  search?: string
  status?: string
}) {
  const ctx = await requireWorkspaceContext()

  // Build where clause
  const baseWhere = { workspaceId: ctx.workspaceId }
  
  let searchClause = {}
  if (options?.search) {
    searchClause = {
      OR: [
        { name: { contains: options.search } },
        { email: { contains: options.search } },
        { phone: { contains: options.search } },
      ],
    }
  }

  let statusClause = {}
  if (options?.status && options.status !== 'all') {
    statusClause = { status: options.status }
  }

  const clients = await prisma.client.findMany({
    where: { ...baseWhere, ...searchClause, ...statusClause },
    orderBy: { updatedAt: 'desc' },
  }) as ClientRow[]

  return clients.map((c) => ({
    ...c,
    tags: JSON.parse(c.tags || '[]') as string[],
  }))
}

export async function getClient(id: string) {
  const ctx = await requireWorkspaceContext()

  const client = await verifyClientAccess(id, ctx.workspaceId)

  if (!client) {
    return null
  }

  return {
    ...client,
    tags: JSON.parse(client.tags || '[]') as string[],
  }
}

export async function createClient(
  input: CreateClientInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireWorkspaceContext()

    const parsed = createClientSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' }
    }

    const { tags, email, phone, note, ...rest } = parsed.data

    const client = await prisma.client.create({
      data: {
        ...rest,
        email: email || null,
        phone: phone || null,
        note: note || null,
        tags: JSON.stringify(tags),
        workspaceId: ctx.workspaceId,
      },
    })

    revalidatePath('/app/clients')
    return { success: true, data: { id: client.id } }
  } catch (error) {
    console.error('Create client error:', error)
    return { success: false, error: 'Failed to create client' }
  }
}

export async function updateClient(
  id: string,
  input: UpdateClientInput
): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceContext()

    // Verify access
    const existing = await verifyClientAccess(id, ctx.workspaceId)
    if (!existing) {
      return { success: false, error: 'Client not found' }
    }

    const parsed = updateClientSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' }
    }

    const { tags, email, phone, note, ...rest } = parsed.data

    await prisma.client.update({
      where: { id },
      data: {
        ...rest,
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(note !== undefined && { note: note || null }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      },
    })

    revalidatePath('/app/clients')
    revalidatePath(`/app/clients/${id}`)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Update client error:', error)
    return { success: false, error: 'Failed to update client' }
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceContext()

    // Verify access
    const existing = await verifyClientAccess(id, ctx.workspaceId)
    if (!existing) {
      return { success: false, error: 'Client not found' }
    }

    await prisma.client.delete({
      where: { id },
    })

    revalidatePath('/app/clients')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete client error:', error)
    return { success: false, error: 'Failed to delete client' }
  }
}
