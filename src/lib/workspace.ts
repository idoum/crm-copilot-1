import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

const WORKSPACE_COOKIE = 'current-workspace'

export interface WorkspaceContext {
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
  userId: string
  role: string
}

/**
 * Get the current workspace context for authenticated routes.
 * Redirects to login if not authenticated.
 * Returns null if user has no workspace access.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const cookieStore = await cookies()
  const savedWorkspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value

  // Try to get the saved workspace
  if (savedWorkspaceId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: savedWorkspaceId,
        },
      },
      include: {
        workspace: true,
      },
    })

    if (membership) {
      return {
        workspaceId: membership.workspaceId,
        workspaceName: membership.workspace.name,
        workspaceSlug: membership.workspace.slug,
        userId,
        role: membership.role,
      }
    }
  }

  // Fallback: get the first workspace the user has access to
  const firstMembership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (!firstMembership) {
    return null
  }

  return {
    workspaceId: firstMembership.workspaceId,
    workspaceName: firstMembership.workspace.name,
    workspaceSlug: firstMembership.workspace.slug,
    userId,
    role: firstMembership.role,
  }
}

/**
 * Require workspace context - throws error if not available.
 * Use this in server actions and API routes.
 */
export async function requireWorkspaceContext(): Promise<WorkspaceContext> {
  const context = await getWorkspaceContext()

  if (!context) {
    throw new Error('No workspace access')
  }

  return context
}

/**
 * Verify that the user has access to a specific resource.
 * Returns the resource if access is granted, null otherwise.
 */
export async function verifyClientAccess(clientId: string, workspaceId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      workspaceId,
    },
  })

  return client
}

/**
 * Verify that the user has OWNER role in the current workspace.
 */
export async function requireOwnerRole(context: WorkspaceContext): Promise<void> {
  if (context.role !== 'OWNER') {
    throw new Error('Owner role required')
  }
}

/**
 * Get all workspaces the user has access to.
 */
export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      workspace: {
        name: 'asc',
      },
    },
  })

  return memberships.map((m: typeof memberships[number]) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
  }))
}
