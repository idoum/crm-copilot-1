'use client'

import { Users } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

export function ClientsEmptyState({ onAddClick }: { onAddClick: () => void }) {
  const t = useTranslations()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <Users className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {t.clients.noClients}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {t.clients.noClientsDesc}
      </p>
      <button
        onClick={onAddClick}
        className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
      >
        {t.clients.addClient}
      </button>
    </div>
  )
}
