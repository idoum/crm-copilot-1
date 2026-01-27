'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslations } from '@/lib/i18n'
import { createClient, updateClient } from '@/lib/actions/clients'
import { toast } from 'sonner'

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    status: string
    tags: string[]
    note: string | null
  }
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: ClientFormDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!client

  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    status: client?.status || 'PROSPECT',
    tags: client?.tags.join(', ') || '',
    note: client?.note || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      const input = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        status: formData.status as 'PROSPECT' | 'ACTIVE' | 'INACTIVE',
        tags,
        note: formData.note || undefined,
      }

      const result = isEditing
        ? await updateClient(client.id, input)
        : await createClient(input)

      if (result.success) {
        toast.success(t.common.success)
        onOpenChange(false)
        router.refresh()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.clients.editClient : t.clients.addClient}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t.clients.editClient
              : t.clients.noClientsDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t.clients.name} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.clients.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.clients.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t.clients.status}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROSPECT">
                  {t.clients.statuses.PROSPECT}
                </SelectItem>
                <SelectItem value="ACTIVE">
                  {t.clients.statuses.ACTIVE}
                </SelectItem>
                <SelectItem value="INACTIVE">
                  {t.clients.statuses.INACTIVE}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              {t.clients.tags}{' '}
              <span className="text-gray-400 text-xs">({t.common.optional})</span>
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="VIP, Paris, B2B"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              {t.clients.note}{' '}
              <span className="text-gray-400 text-xs">({t.common.optional})</span>
            </Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, note: e.target.value }))
              }
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                t.common.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
