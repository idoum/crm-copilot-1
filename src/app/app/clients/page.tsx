import { Suspense } from 'react'
import { getClients } from '@/lib/actions/clients'
import { ClientsPageClient } from './page-client'
import { ClientsTableSkeleton } from '@/components/clients'

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams
  const clients = await getClients({
    search: params.search,
    status: params.status,
  })

  return (
    <ClientsPageClient
      clients={clients}
      searchQuery={params.search || ''}
      statusFilter={params.status || 'all'}
    />
  )
}
