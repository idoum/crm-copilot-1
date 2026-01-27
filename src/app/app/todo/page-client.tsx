'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckSquare,
  AlertCircle,
  Clock,
  Calendar,
  Check,
  User2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from '@/lib/i18n'
import { toggleFollowUpStatus } from '@/lib/actions/followups'
import { toast } from 'sonner'

interface FollowUp {
  id: string
  reason: string
  dueDate: Date
  status: string
  client: {
    id: string
    name: string
  }
}

interface TodoPageClientProps {
  followUps: FollowUp[]
}

export function TodoPageClient({ followUps }: TodoPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const openFollowUps = followUps.filter((f) => f.status === 'OPEN')

  const overdue = openFollowUps.filter(
    (f) => new Date(f.dueDate) < today
  )
  const todayItems = openFollowUps.filter((f) => {
    const d = new Date(f.dueDate)
    return d >= today && d < tomorrow
  })
  const upcoming = openFollowUps.filter(
    (f) => new Date(f.dueDate) >= tomorrow
  )

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const result = await toggleFollowUpStatus(id)

      if (result.success) {
        toast.success(t.common.success)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const renderFollowUp = (followUp: FollowUp, variant: 'overdue' | 'today' | 'upcoming') => {
    const bgColors = {
      overdue: 'bg-red-50 border-red-100 hover:bg-red-100',
      today: 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100',
      upcoming: 'bg-white border-gray-200 hover:bg-gray-50',
    }

    return (
      <Card
        key={followUp.id}
        className={`transition-colors cursor-pointer ${bgColors[variant]}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggle(followUp.id)
              }}
              disabled={isPending}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300 hover:border-primary transition-colors"
            >
              {followUp.status === 'DONE' && <Check className="h-3 w-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {followUp.reason}
              </p>
              <Link
                href={`/app/clients/${followUp.client.id}`}
                className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <User2 className="h-3 w-3" />
                {followUp.client.name}
              </Link>
              <div className="mt-2 flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span
                  className={`text-xs ${
                    variant === 'overdue'
                      ? 'text-red-600 font-medium'
                      : variant === 'today'
                      ? 'text-yellow-600 font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {new Date(followUp.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEmptyState = () => (
    <div className="py-16 text-center">
      <CheckSquare className="h-16 w-16 mx-auto text-green-200" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">{t.todo.noTasks}</h3>
      <p className="mt-1 text-sm text-gray-500">{t.todo.noTasksDesc}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.todo.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.todo.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={overdue.length > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${overdue.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertCircle className={`h-5 w-5 ${overdue.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdue.length}</p>
              <p className="text-xs text-gray-500">{t.todo.overdue}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={todayItems.length > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${todayItems.length > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <Clock className={`h-5 w-5 ${todayItems.length > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todayItems.length}</p>
              <p className="text-xs text-gray-500">{t.todo.today}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
              <p className="text-xs text-gray-500">{t.todo.upcoming}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overdue" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overdue" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            {t.todo.overdue}
            {overdue.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                {overdue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            <Clock className="h-4 w-4" />
            {t.todo.today}
            {todayItems.length > 0 && (
              <Badge className="ml-1 px-1.5 py-0 text-xs bg-yellow-500">
                {todayItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            {t.todo.upcoming}
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {upcoming.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="mt-4">
          {overdue.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-3">
              {overdue.map((f) => renderFollowUp(f, 'overdue'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          {todayItems.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-3">
              {todayItems.map((f) => renderFollowUp(f, 'today'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-3">
              {upcoming.map((f) => renderFollowUp(f, 'upcoming'))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
