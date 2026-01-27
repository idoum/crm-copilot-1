'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n'
import {
  ClientInfoCard,
  ActivityTimeline,
  FollowUpList,
  ClientFormDialog,
} from '@/components/clients'

interface ClientDetailClientProps {
  client: {
    id: string
    name: string
    email: string | null
    phone: string | null
    status: string
    tags: string[]
    note: string | null
    createdAt: Date
    updatedAt: Date
  }
  activities: {
    id: string
    type: string
    content: string
    occurredAt: Date
  }[]
  followUps: {
    id: string
    reason: string
    dueDate: Date
    status: string
  }[]
}

export function ClientDetailClient({
  client,
  activities,
  followUps,
}: ClientDetailClientProps) {
  const t = useTranslations()
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.clients.clientDetails}
            </h1>
            <p className="text-sm text-gray-500">{client.name}</p>
          </div>
        </div>
        <Button onClick={() => setIsEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          {t.common.edit}
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Client info */}
        <div className="lg:col-span-1">
          <ClientInfoCard client={client} />
        </div>

        {/* Right column - Timeline & Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityTimeline clientId={client.id} activities={activities} />
          <FollowUpList clientId={client.id} followUps={followUps} />
        </div>
      </div>

      {/* Edit Dialog */}
      <ClientFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        client={client}
      />
    </div>
  )
}
