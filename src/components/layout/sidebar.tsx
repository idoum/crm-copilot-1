'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CheckSquare, Settings, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'

const navigation = [
  { name: 'clients', href: '/app/clients', icon: Users },
  { name: 'todo', href: '/app/todo', icon: CheckSquare },
  { name: 'settings', href: '/app/settings', icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">
            {t.common.appName}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                      )}
                      aria-hidden="true"
                    />
                    {t.nav[item.name]}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
