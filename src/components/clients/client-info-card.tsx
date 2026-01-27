'use client'

import { Mail, Phone, FileText, User2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from '@/lib/i18n'

interface ClientInfoCardProps {
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
}

const statusColors: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
}

export function ClientInfoCard({ client }: ClientInfoCardProps) {
  const t = useTranslations()

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{client.name}</CardTitle>
              <Badge
                variant="secondary"
                className={`mt-1 ${statusColors[client.status]}`}
              >
                {t.clients.statuses[client.status as keyof typeof t.clients.statuses]}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-3">
          {client.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${client.email}`}
                className="text-gray-700 hover:text-primary transition-colors"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <a
                href={`tel:${client.phone}`}
                className="text-gray-700 hover:text-primary transition-colors"
              >
                {client.phone}
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {client.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">{t.clients.tags}</h4>
            <div className="flex flex-wrap gap-1">
              {client.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {client.note && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">{t.clients.note}</h4>
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {client.note}
              </p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t border-gray-100 space-y-1 text-xs text-gray-400">
          <p>
            {t.clients.createdAt}:{' '}
            {new Date(client.createdAt).toLocaleDateString()}
          </p>
          <p>
            {t.clients.updatedAt}:{' '}
            {new Date(client.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
