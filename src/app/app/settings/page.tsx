import { getWorkspaceContext, getUserWorkspaces } from '@/lib/workspace'
import { prisma } from '@/lib/prisma'
import { SettingsPageClient } from './page-client'

export default async function SettingsPage() {
  const ctx = await getWorkspaceContext()

  if (!ctx) {
    return null
  }

  // Check if user has a password set (for security section)
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { password: true },
  })

  // Get workspace members
  const members = await prisma.membership.findMany({
    where: { workspaceId: ctx.workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Get all workspaces for switcher
  const workspaces = await getUserWorkspaces(ctx.userId)

  return (
    <SettingsPageClient
      currentWorkspace={{
        id: ctx.workspaceId,
        name: ctx.workspaceName,
        slug: ctx.workspaceSlug,
      }}
      members={members.map((m: typeof members[number]) => ({
        id: m.id,
        role: m.role,
        user: m.user,
      }))}
      workspaces={workspaces}
      currentUserId={ctx.userId}
      userRole={ctx.role}
      hasPassword={!!user?.password}
    />
  )
}
