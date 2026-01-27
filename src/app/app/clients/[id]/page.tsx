import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClient } from '@/lib/actions/clients'
import { getActivities } from '@/lib/actions/activities'
import { getFollowUps } from '@/lib/actions/followups'
import { ClientDetailClient } from './page-client'

interface ClientDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params

  const [client, activities, followUps] = await Promise.all([
    getClient(id),
    getActivities(id),
    getFollowUps(id),
  ])

  // IDOR protection: if client not found or not in workspace, return 404
  if (!client) {
    notFound()
  }

  return (
    <ClientDetailClient
      client={client}
      activities={activities}
      followUps={followUps}
    />
  )
}
