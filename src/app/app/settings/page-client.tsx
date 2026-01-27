'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Crown, Link2, Copy, Check, Loader2, UserPlus, UserMinus, Shield, Lock, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from '@/lib/i18n'
import { setCurrentWorkspace } from '@/lib/actions/workspace'
import { generateInvite } from '@/lib/actions/invitations'
import { deactivateMember } from '@/lib/actions/members'
import { changePassword } from '@/lib/actions/password'
import { toast } from 'sonner'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface Workspace {
  id: string
  name: string
  slug: string
  role: string
}

interface SettingsPageClientProps {
  currentWorkspace: {
    id: string
    name: string
    slug: string
  }
  members: Member[]
  workspaces: Workspace[]
  currentUserId: string
  userRole: string
  hasPassword: boolean // Whether user has a password (not OAuth-only)
}

export function SettingsPageClient({
  currentWorkspace,
  members,
  workspaces,
  currentUserId,
  userRole,
  hasPassword,
}: SettingsPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'OWNER'>('MEMBER')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteExpiresAt, setInviteExpiresAt] = useState<Date | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const isOwner = userRole === 'OWNER'

  const handleSwitchWorkspace = (workspaceId: string) => {
    if (workspaceId === currentWorkspace.id) return

    startTransition(async () => {
      await setCurrentWorkspace(workspaceId)
      toast.success(t.common.success)
      router.refresh()
      router.push('/app/clients')
    })
  }

  const handleGenerateInvite = async () => {
    setIsGenerating(true)
    
    const formData = new FormData()
    formData.set('workspaceId', currentWorkspace.id)
    formData.set('role', inviteRole)
    
    const result = await generateInvite(formData)
    
    if (result.success) {
      setInviteLink(result.inviteLink)
      setInviteExpiresAt(result.expiresAt)
      toast.success(t.settings.inviteLinkGenerated)
    } else {
      toast.error(t.errors.serverError)
    }
    
    setIsGenerating(false)
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success(t.settings.linkCopied)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t.errors.serverError)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setInviteDialogOpen(open)
    if (!open) {
      // Reset state when closing
      setInviteLink(null)
      setInviteExpiresAt(null)
      setInviteRole('MEMBER')
      setCopied(false)
    }
  }

  const handleDeactivateMember = async (membershipId: string) => {
    startTransition(async () => {
      const result = await deactivateMember(membershipId)
      
      if (result.success) {
        toast.success(t.settings.deactivateMemberSuccess)
        router.refresh()
      } else {
        switch (result.error) {
          case 'cannotDeactivateSelf':
            toast.error(t.settings.cannotDeactivateSelf)
            break
          case 'cannotDeactivateLastOwner':
            toast.error(t.settings.cannotDeactivateLastOwner)
            break
          default:
            toast.error(t.errors.serverError)
        }
      }
    })
  }

  const handleChangePassword = async (formData: FormData) => {
    setIsChangingPassword(true)
    setPasswordError(null)

    // Client-side validation
    const newPassword = formData.get('newPassword') as string
    const confirmNewPassword = formData.get('confirmNewPassword') as string

    if (newPassword.length < 8) {
      setPasswordError(t.auth.passwordMinLength8)
      setIsChangingPassword(false)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t.auth.passwordsDoNotMatch)
      setIsChangingPassword(false)
      return
    }

    const result = await changePassword(formData)

    setIsChangingPassword(false)

    if (result.success) {
      toast.success(t.settings.passwordChanged)
      // Clear form by refreshing
      router.refresh()
    } else {
      switch (result.error) {
        case 'wrongPassword':
          setPasswordError(t.settings.wrongPassword)
          break
        case 'noPassword':
          setPasswordError(t.settings.noPasswordSet)
          break
        case 'rateLimited':
          setPasswordError(t.settings.rateLimited)
          break
        case 'validationError':
          setPasswordError(result.message || t.errors.serverError)
          break
        default:
          setPasswordError(t.errors.serverError)
      }
    }
  }

  const otherWorkspaces = workspaces.filter((w) => w.id !== currentWorkspace.id)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.settings.subtitle}</p>
      </div>

      <div className="grid gap-6">
        {/* Current Workspace */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t.settings.workspace}</CardTitle>
                <CardDescription>{t.settings.workspaceName}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
              <div>
                <p className="font-medium text-gray-900">{currentWorkspace.name}</p>
                <p className="text-sm text-gray-500">/{currentWorkspace.slug}</p>
              </div>
              <Badge variant="outline" className="bg-white">
                {t.settings.roles[userRole as keyof typeof t.settings.roles]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Switcher */}
        {otherWorkspaces.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.switchWorkspace}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {otherWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleSwitchWorkspace(workspace.id)}
                    disabled={isPending}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
                        <Building2 className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {workspace.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t.settings.roles[workspace.role as keyof typeof t.settings.roles]}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t.settings.members}</CardTitle>
                  <CardDescription>
                    {members.length} {members.length === 1 ? 'membre' : 'membres'}
                  </CardDescription>
                </div>
              </div>
              
              {/* Invite Button - Only for Owners */}
              {isOwner && (
                <Dialog open={inviteDialogOpen} onOpenChange={handleOpenChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t.settings.generateInviteLink}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        {t.settings.inviteLinkTitle}
                      </DialogTitle>
                      <DialogDescription>
                        {t.settings.inviteLinkDescription}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      {!inviteLink ? (
                        <>
                          {/* Role selection */}
                          <div className="space-y-2">
                            <Label>{t.settings.inviteRole}</Label>
                            <Select
                              value={inviteRole}
                              onValueChange={(v) => setInviteRole(v as 'MEMBER' | 'OWNER')}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEMBER">
                                  {t.settings.roles.MEMBER}
                                </SelectItem>
                                <SelectItem value="OWNER">
                                  {t.settings.roles.OWNER}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <p className="text-sm text-gray-500">
                            {t.settings.inviteExpiresIn}
                          </p>
                          
                          <Button
                            onClick={handleGenerateInvite}
                            disabled={isGenerating}
                            className="w-full"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.common.loading}
                              </>
                            ) : (
                              <>
                                <Link2 className="mr-2 h-4 w-4" />
                                {t.settings.generateLink}
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Generated link */}
                          <div className="space-y-2">
                            <Label>{t.settings.inviteLinkTitle}</Label>
                            <div className="flex gap-2">
                              <Input
                                readOnly
                                value={inviteLink}
                                className="font-mono text-xs"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleCopyLink}
                              >
                                {copied ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="secondary">
                              {t.settings.roles[inviteRole]}
                            </Badge>
                            <span>•</span>
                            <span>{t.settings.inviteExpiresIn}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => {
                const initials =
                  member.user.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() ||
                  member.user.email?.[0]?.toUpperCase() ||
                  'U'

                const canDeactivate = isOwner && member.user.id !== currentUserId

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={member.user.image || undefined}
                          alt={member.user.name || ''}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {member.user.name || member.user.email}
                          </p>
                          {member.user.id === currentUserId && (
                            <Badge variant="secondary" className="text-xs py-0">
                              {t.common.you}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'OWNER' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <Badge
                        variant={member.role === 'OWNER' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {t.settings.roles[member.role as keyof typeof t.settings.roles]}
                      </Badge>
                      
                      {/* Deactivate button - only for owners, cannot deactivate self */}
                      {canDeactivate && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                              disabled={isPending}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.settings.deactivateMemberTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.settings.deactivateMemberDescription}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeactivateMember(member.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {t.settings.deactivateMember}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Security - Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t.settings.security}</CardTitle>
                <CardDescription>{t.settings.securityDescription}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasPassword ? (
              <form action={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t.settings.currentPassword}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      className="h-11 pl-10 pr-10"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t.settings.newPassword}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      className="h-11 pl-10 pr-10"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{t.auth.passwordMinLength8}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">{t.settings.confirmNewPassword}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      className="h-11 pl-10"
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                    {passwordError}
                  </div>
                )}

                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    t.settings.changePassword
                  )}
                </Button>
              </form>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 border">
                {t.settings.noPasswordSet}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
