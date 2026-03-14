export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import DashboardClient from '@/components/DashboardClient'

export default function Home() {
  const user = getAuthUser()
  if (!user) redirect('/login')
  return <DashboardClient initialUser={user} />
}
