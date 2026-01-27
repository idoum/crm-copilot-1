'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { acceptInvite } from '@/lib/actions/invitations'
import { toast } from 'sonner'

interface AcceptInviteClientProps {
  token?: string
  workspaceName?: string
  role?: string
  error?: 'invalid' | 'expired' | 'used' | 'revoked'
}

function AcceptInviteContent({
  token,
  workspaceName,
  role,
  error,
}: AcceptInviteClientProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const handleAccept = () => {
    if (!token) return

    startTransition(async () => {
      const result = await acceptInvite(token)

      if (result.success) {
        setSuccess(true)
        if (result.alreadyMember) {
          toast.info(t.acceptInvite.alreadyMember)
        } else {
          toast.success(t.acceptInvite.successMessage)
        }
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/app/clients')
        }, 1500)
      } else {
        // Map error to translated message
        const errorMessages: Record<string, string> = {
          invalid: t.errors.inviteInvalid,
          expired: t.errors.inviteExpired,
          used: t.errors.inviteAlreadyUsed,
          revoked: t.errors.inviteRevoked,
          unauthorized: t.errors.unauthorized,
          serverError: t.errors.serverError,
        }
        setAcceptError(errorMessages[result.error] || t.errors.serverError)
      }
    })
  }

  // Error state
  if (error) {
    const errorMessages: Record<string, string> = {
      invalid: t.errors.inviteInvalid,
      expired: t.errors.inviteExpired,
      used: t.errors.inviteAlreadyUsed,
      revoked: t.errors.inviteRevoked,
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {t.common.error}
              </CardTitle>
              <CardDescription className="mt-2 text-red-600">
                {errorMessages[error] || t.errors.serverError}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
            >
              {t.common.back}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {t.common.success}
              </CardTitle>
              <CardDescription className="mt-2">
                {t.acceptInvite.successMessage}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Accept state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {t.acceptInvite.title}
            </CardTitle>
            <CardDescription className="mt-2">
              {t.acceptInvite.subtitle}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workspace info */}
          <div className="rounded-lg bg-gray-50 p-4 border space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t.acceptInvite.workspaceName}</p>
                <p className="font-semibold text-gray-900">{workspaceName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t.acceptInvite.roleLabel}</p>
                <Badge variant={role === 'OWNER' ? 'default' : 'secondary'}>
                  {t.settings.roles[role as keyof typeof t.settings.roles]}
                </Badge>
              </div>
            </div>
          </div>

          {acceptError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {acceptError}
            </div>
          )}

          <Button
            onClick={handleAccept}
            disabled={isPending}
            className="w-full h-11 text-base font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.acceptInvite.accepting}
              </>
            ) : (
              t.acceptInvite.acceptButton
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function AcceptInviteClient(props: AcceptInviteClientProps) {
  return (
    <I18nProvider>
      <AcceptInviteContent {...props} />
    </I18nProvider>
  )
}
