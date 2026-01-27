'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, Loader2, User, Mail, Lock, Briefcase, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { login, createTenantAccount, createUserOnly } from '@/lib/actions/auth'
import { useI18n, I18nProvider } from '@/lib/i18n'
import { toast } from 'sonner'

function LoginForm() {
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isSignupLoading, setIsSignupLoading] = useState(false)
  const [isJoinLoading, setIsJoinLoading] = useState(false)
  const { locale, setLocale, t } = useI18n()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next')
  const message = searchParams.get('message')
  
  // Show success message for password reset
  const [showPasswordUpdated, setShowPasswordUpdated] = useState(false)
  
  useEffect(() => {
    if (message === 'password-updated') {
      setShowPasswordUpdated(true)
    }
  }, [message])
  
  // Detect if we're coming from an invite link
  const isInviteFlow = nextUrl?.includes('/accept-invite')
  
  // Determine the default tab
  const defaultTab = isInviteFlow ? 'join' : 'signin'

  const handleLogin = async (formData: FormData) => {
    setIsLoginLoading(true)
    setLoginError(null)

    // Pass the redirect URL if we have a next parameter
    const redirectTo = nextUrl ? decodeURIComponent(nextUrl) : undefined
    const result = await login(formData, redirectTo)

    if (result?.error) {
      setLoginError(result.error === 'invalidCredentials' 
        ? t.auth.invalidCredentials 
        : t.errors.serverError)
      setIsLoginLoading(false)
    }
  }

  const handleSignup = async (formData: FormData) => {
    setIsSignupLoading(true)
    setSignupError(null)

    // Client-side validation
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 6) {
      setSignupError(t.auth.passwordMinLength)
      setIsSignupLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setSignupError(t.auth.passwordsDoNotMatch)
      setIsSignupLoading(false)
      return
    }

    const result = await createTenantAccount(formData)

    if (!result.success) {
      switch (result.error) {
        case 'emailExists':
          setSignupError(t.auth.emailExists)
          break
        case 'validationError':
          setSignupError(result.message || t.errors.serverError)
          break
        default:
          setSignupError(t.errors.serverError)
      }
      setIsSignupLoading(false)
    } else {
      toast.success(t.auth.accountCreated)
    }
  }

  const handleJoin = async (formData: FormData) => {
    setIsJoinLoading(true)
    setJoinError(null)

    // Client-side validation
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 6) {
      setJoinError(t.auth.passwordMinLength)
      setIsJoinLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setJoinError(t.auth.passwordsDoNotMatch)
      setIsJoinLoading(false)
      return
    }

    // Redirect to the invite accept page after creating user
    const redirectTo = nextUrl ? decodeURIComponent(nextUrl) : '/app/clients'
    const result = await createUserOnly(formData, redirectTo)

    if (!result.success) {
      switch (result.error) {
        case 'emailExists':
          setJoinError(t.auth.emailExists)
          break
        case 'validationError':
          setJoinError(result.message || t.errors.serverError)
          break
        default:
          setJoinError(t.errors.serverError)
      }
      setIsJoinLoading(false)
    } else {
      toast.success(t.auth.accountCreated)
    }
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
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className={`grid w-full mb-6 ${isInviteFlow ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="signin">{t.auth.tabSignIn}</TabsTrigger>
              {isInviteFlow ? (
                <TabsTrigger value="join">{t.auth.tabJoin}</TabsTrigger>
              ) : null}
              <TabsTrigger value="signup">{t.auth.tabSignUp}</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t.auth.signInTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">{t.auth.signInSubtitle}</p>
              </div>
              <form action={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t.auth.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="demo@example.com"
                      required
                      autoComplete="email"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t.auth.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                {showPasswordUpdated && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {t.auth.passwordUpdated}
                  </div>
                )}

                {loginError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    t.auth.signIn
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-600 hover:text-primary transition-colors"
                  >
                    {t.auth.forgotPassword}
                  </Link>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Demo: demo@example.com / demo123</p>
              </div>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t.auth.signUpTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">{t.auth.signUpSubtitle}</p>
              </div>
              <form action={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">
                    {t.auth.workspaceName} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="workspaceName"
                      name="workspaceName"
                      type="text"
                      placeholder={t.auth.workspaceNamePlaceholder}
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t.auth.yourName} <span className="text-gray-400 text-xs">({t.common.optional})</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t.auth.yourNamePlaceholder}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    {t.auth.email} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="vous@example.com"
                      required
                      autoComplete="email"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    {t.auth.password} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t.auth.confirmPassword} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                {signupError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                    {signupError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isSignupLoading}
                >
                  {isSignupLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    t.auth.createAccount
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Join Tab (only shown when coming from invite link) */}
            {isInviteFlow && (
              <TabsContent value="join">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{t.auth.joinTitle}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t.auth.joinSubtitle}</p>
                </div>
                <form action={handleJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-name">
                      {t.auth.yourName} <span className="text-gray-400 text-xs">({t.common.optional})</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="join-name"
                        name="name"
                        type="text"
                        placeholder={t.auth.yourNamePlaceholder}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="join-email">
                      {t.auth.email} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="join-email"
                        name="email"
                        type="email"
                        placeholder="vous@example.com"
                        required
                        autoComplete="email"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="join-password">
                      {t.auth.password} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="join-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="join-confirmPassword">
                      {t.auth.confirmPassword} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="join-confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  {joinError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                      {joinError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isJoinLoading}
                  >
                    {isJoinLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.common.loading}
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        {t.auth.joinButton}
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginClient() {
  return (
    <I18nProvider>
      <LoginForm />
    </I18nProvider>
  )
}
