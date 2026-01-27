import { getFollowUps } from '@/lib/actions/followups'
import { TodoPageClient } from './page-client'

export default async function TodoPage() {
  const followUps = await getFollowUps()

  return <TodoPageClient followUps={followUps} />
}
