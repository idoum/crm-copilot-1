'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from '@/lib/i18n'
import {
  ClientsTable,
  ClientsEmptyState,
  ClientFormDialog,
} from '@/components/clients'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  tags: string[]
  note: string | null
}

interface ClientsPageClientProps {
  clients: Client[]
  searchQuery: string
  statusFilter: string
}

export function ClientsPageClient({
  clients,
  searchQuery,
  statusFilter,
}: ClientsPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [search, setSearch] = useState(searchQuery)

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    router.push(`/app/clients?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (value && value !== 'all') params.set('status', value)
    router.push(`/app/clients?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.clients.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.clients.subtitle}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {t.clients.addClient}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t.clients.searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4 text-gray-400" />
            <SelectValue placeholder={t.clients.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.all}</SelectItem>
            <SelectItem value="PROSPECT">
              {t.clients.statuses.PROSPECT}
            </SelectItem>
            <SelectItem value="ACTIVE">{t.clients.statuses.ACTIVE}</SelectItem>
            <SelectItem value="INACTIVE">
              {t.clients.statuses.INACTIVE}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {clients.length === 0 ? (
        <ClientsEmptyState onAddClick={() => setIsAddDialogOpen(true)} />
      ) : (
        <ClientsTable clients={clients} />
      )}

      {/* Add Client Dialog */}
      <ClientFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  )
}
