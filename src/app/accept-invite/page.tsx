import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { validateInvite } from '@/lib/actions/invitations'
import { AcceptInviteClient } from './page-client'

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return <AcceptInviteClient error="invalid" />
  }

  // Check if user is authenticated
  const session = await auth()

  if (!session?.user?.id) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(`/accept-invite?token=${token}`)
    redirect(`/login?next=${returnUrl}`)
  }

  // Validate the token
  const validation = await validateInvite(token)

  if (!validation.valid) {
    return <AcceptInviteClient error={validation.error} />
  }

  return (
    <AcceptInviteClient
      token={token}
      workspaceName={validation.workspaceName}
      role={validation.role}
    />
  )
}
