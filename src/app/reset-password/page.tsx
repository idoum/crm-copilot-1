'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Loader2, Lock, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { resetPassword } from '@/lib/actions/password-reset'
import { useI18n, I18nProvider } from '@/lib/i18n'
import { toast } from 'sonner'

/**
 * UI Checklist - Reset Password Page:
 * - Layout: Centered card on gradient background
 * - Components: Card, Input (password x2), Button, Alert (error)
 * - States: 
 *   - Token missing: Error state with link to forgot-password
 *   - Default form: Password + confirm fields
 *   - Loading state: Spinner on button
 *   - Error state: Invalid/expired token message
 *   - Success: Redirect to /login with message
 * - Language switcher in top right
 */

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { locale, setLocale, t } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    // Client-side validation
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 8) {
      setError(t.auth.passwordMinLength8)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordsDoNotMatch)
      setIsLoading(false)
      return
    }

    // Add token to form data
    formData.set('token', token || '')

    const result = await resetPassword(formData)

    if (result.success) {
      toast.success(t.auth.passwordUpdated)
      router.push('/login?message=password-updated')
    } else {
      setIsLoading(false)
      switch (result.error) {
        case 'tokenInvalid':
          setError(t.auth.resetTokenInvalid)
          break
        case 'validationError':
          setError(result.message || t.errors.serverError)
          break
        default:
          setError(t.errors.serverError)
      }
    }
  }

  // Token missing state
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t.auth.resetPasswordTitle}</h1>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 text-center">
              {t.auth.resetTokenMissing}
            </div>
            <Link href="/forgot-password" className="block">
              <Button variant="outline" className="w-full">
                {t.auth.forgotPassword}
              </Button>
            </Link>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="inline h-3 w-3 mr-1" />
                {t.auth.backToLogin}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <h1 className="text-xl font-bold text-gray-900">{t.auth.resetPasswordTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">{t.auth.resetPasswordSubtitle}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.newPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="h-11 pl-10"
                  disabled={isLoading}
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500">{t.auth.passwordMinLength8}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="h-11 pl-10"
                  disabled={isLoading}
                  minLength={8}
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
                t.auth.resetPassword
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
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <I18nProvider>
      <ResetPasswordForm />
    </I18nProvider>
  )
}
