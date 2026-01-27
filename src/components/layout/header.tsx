'use client'

import { useTransition } from 'react'
import { LogOut, ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useI18n, useTranslations } from '@/lib/i18n'
import { logout } from '@/lib/actions/auth'

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  workspaceName: string
}

export function Header({ user, workspaceName }: HeaderProps) {
  const [isPending, startTransition] = useTransition()
  const { locale, setLocale } = useI18n()
  const t = useTranslations()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  const toggleLocale = () => {
    setLocale(locale === 'fr' ? 'en' : 'fr')
  }

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Workspace name */}
      <div className="flex flex-1 items-center gap-x-4">
        <span className="text-sm font-medium text-gray-500">{workspaceName}</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-x-4">
        {/* Language switcher */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLocale}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{locale.toUpperCase()}</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full p-1 pr-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-gray-700 md:block">
                {user.name || user.email}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isPending}
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t.auth.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
