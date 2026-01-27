'use server'

import { cookies } from 'next/headers'
import { isSecureCookie, workspaceCookieMaxAge } from '@/lib/env'

const WORKSPACE_COOKIE = 'current-workspace'

export async function setCurrentWorkspace(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    path: '/',
    maxAge: workspaceCookieMaxAge,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
  })
}

export async function getCurrentWorkspaceId(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(WORKSPACE_COOKIE)?.value
}
