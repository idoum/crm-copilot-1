'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Loader2, Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { requestPasswordReset, type RequestPasswordResetResult } from '@/lib/actions/password-reset'
import { useI18n, I18nProvider } from '@/lib/i18n'

/**
 * UI Checklist - Forgot Password Page:
 * - Layout: Centered card on gradient background
 * - Components: Card, Input (email), Button, Alert (success/error)
 * - States: Default form, Loading state, Success state (link sent message)
 * - Language switcher in top right
 * - Back to login link
 * - DEV-only: Debug info about email sending status
 */

// Check if we're in development mode (client-side check)
const isDev = process.env.NODE_ENV !== 'production'

type DevDebugInfo = {
  sent: boolean
  reason?: 'user_not_found' | 'oauth_user' | 'smtp_failed' | 'rate_limited'
  error?: string
}

function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devDebug, setDevDebug] = useState<DevDebugInfo | null>(null)
  const { locale, setLocale, t } = useI18n()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    setDevDebug(null)

    const result = await requestPasswordReset(formData) as RequestPasswordResetResult & { dev?: DevDebugInfo }

    setIsLoading(false)

    if (result.success) {
      setIsSuccess(true)
      // Store DEV debug info if available
      if (isDev && result.dev) {
        setDevDebug(result.dev)
      }
    } else {
      if (result.error === 'validationError') {
        setError(result.message || t.errors.serverError)
      } else {
        setError(t.errors.serverError)
      }
    }
  }

  // Get DEV debug message based on reason
  const getDevDebugMessage = (): string | null => {
    if (!isDev || !devDebug) return null
    
    if (devDebug.sent) {
      return t.settings.devEmailSent
    }
    
    switch (devDebug.reason) {
      case 'user_not_found':
        return t.settings.devUserNotFound
      case 'oauth_user':
        return t.settings.devOAuthUser
      case 'smtp_failed':
        return `${t.settings.devEmailFailed}${devDebug.error ? `: ${devDebug.error}` : ''}`
      case 'rate_limited':
        return t.settings.devRateLimited
      default:
        return null
    }
  }

  const devMessage = getDevDebugMessage()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Language switcher */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
          className="text-gray-600"
        >
          {locale === 'fr' ? 'EN' : 'FR'}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.auth.forgotPasswordTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">{t.auth.forgotPasswordSubtitle}</p>
          </div>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            // Success state
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200 text-center">
                {t.auth.resetLinkSent}
              </div>
              
              {/* DEV-only debug info - never appears in production */}
              {isDev && devMessage && (
                <div className={`rounded-lg p-3 text-xs border flex items-center gap-2 ${
                  devDebug?.sent 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  {devMessage}
                </div>
              )}
              
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.auth.backToLogin}
                </Button>
              </Link>
            </div>
          ) : (
            // Form state
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="demo@example.com"
                    required
                    autoComplete="email"
                    className="h-11 pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.common.loading}
                  </>
                ) : (
                  t.auth.sendResetLink
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="inline h-3 w-3 mr-1" />
                  {t.auth.backToLogin}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <I18nProvider>
      <ForgotPasswordForm />
    </I18nProvider>
  )
}
