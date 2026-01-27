'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Plus,
  Check,
  RotateCcw,
  Trash2,
  Loader2,
  CalendarDays,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTranslations } from '@/lib/i18n'
import {
  createFollowUp,
  toggleFollowUpStatus,
  deleteFollowUp,
} from '@/lib/actions/followups'
import { toast } from 'sonner'

interface FollowUp {
  id: string
  reason: string
  dueDate: Date
  status: string
}

interface FollowUpListProps {
  clientId: string
  followUps: FollowUp[]
}

export function FollowUpList({ clientId, followUps }: FollowUpListProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    reason: '',
    dueDate: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await createFollowUp({
        clientId,
        reason: formData.reason,
        dueDate: new Date(formData.dueDate),
      })

      if (result.success) {
        toast.success(t.common.success)
        setIsAddOpen(false)
        setFormData({ reason: '', dueDate: new Date().toISOString().split('T')[0] })
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

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

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteFollowUp(id)

      if (result.success) {
        toast.success(t.common.success)
        setDeletingId(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const isOverdue = (date: Date, status: string) => {
    if (status === 'DONE') return false
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    const d = new Date(date)
    return d.toDateString() === today.toDateString()
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">{t.followUps.title}</CardTitle>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t.followUps.addFollowUp}
          </Button>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-10 w-10 mx-auto text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {t.followUps.noFollowUps}
              </p>
              <p className="text-xs text-gray-400">
                {t.followUps.noFollowUpsDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map((followUp) => {
                const overdue = isOverdue(followUp.dueDate, followUp.status)
                const today = isToday(followUp.dueDate)

                return (
                  <div
                    key={followUp.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      followUp.status === 'DONE'
                        ? 'bg-gray-50 border-gray-100'
                        : overdue
                        ? 'bg-red-50 border-red-100'
                        : today
                        ? 'bg-yellow-50 border-yellow-100'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => handleToggle(followUp.id)}
                      disabled={isPending}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        followUp.status === 'DONE'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {followUp.status === 'DONE' && <Check className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          followUp.status === 'DONE'
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {followUp.reason}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <CalendarDays className="h-3 w-3 text-gray-400" />
                        <span
                          className={`text-xs ${
                            overdue
                              ? 'text-red-600 font-medium'
                              : today
                              ? 'text-yellow-600 font-medium'
                              : 'text-gray-400'
                          }`}
                        >
                          {new Date(followUp.dueDate).toLocaleDateString()}
                        </span>
                        {overdue && (
                          <Badge variant="destructive" className="text-xs py-0">
                            {t.todo.overdue}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {followUp.status === 'DONE' && (
                        <button
                          onClick={() => handleToggle(followUp.id)}
                          disabled={isPending}
                          className="p-1 text-gray-400 hover:text-primary transition-colors"
                          title={t.followUps.markOpen}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingId(followUp.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Follow-up Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.followUps.addFollowUp}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.followUps.reason}</Label>
              <Input
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t.followUps.dueDate}</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
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
