'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from '@/lib/i18n'
import { createActivity, deleteActivity } from '@/lib/actions/activities'
import { toast } from 'sonner'

interface Activity {
  id: string
  type: string
  content: string
  occurredAt: Date
}

interface ActivityTimelineProps {
  clientId: string
  activities: Activity[]
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  NOTE: MessageSquare,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
}

const activityColors: Record<string, string> = {
  NOTE: 'bg-gray-100 text-gray-600',
  CALL: 'bg-blue-100 text-blue-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  MEETING: 'bg-green-100 text-green-600',
}

export function ActivityTimeline({ clientId, activities }: ActivityTimelineProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: 'NOTE',
    content: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await createActivity({
        clientId,
        type: formData.type as 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING',
        content: formData.content,
      })

      if (result.success) {
        toast.success(t.common.success)
        setIsAddOpen(false)
        setFormData({ type: 'NOTE', content: '' })
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteActivity(id)

      if (result.success) {
        toast.success(t.common.success)
        setDeletingId(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">{t.clients.timeline}</CardTitle>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t.activities.addActivity}
          </Button>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {t.activities.noActivities}
              </p>
              <p className="text-xs text-gray-400">
                {t.activities.noActivitiesDesc}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || MessageSquare
                  return (
                    <div key={activity.id} className="relative flex gap-4 group">
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activityColors[activity.type]}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {t.activities.types[activity.type as keyof typeof t.activities.types]}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {new Date(activity.occurredAt).toLocaleString()}
                            </span>
                            <button
                              onClick={() => setDeletingId(activity.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                          {activity.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Activity Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.activities.addActivity}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.activities.type}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">{t.activities.types.NOTE}</SelectItem>
                  <SelectItem value="CALL">{t.activities.types.CALL}</SelectItem>
                  <SelectItem value="EMAIL">{t.activities.types.EMAIL}</SelectItem>
                  <SelectItem value="MEETING">{t.activities.types.MEETING}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.activities.content}</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.delete}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">{t.clients.deleteConfirm}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={isPending}
            >
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
