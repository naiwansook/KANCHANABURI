export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import FacebookAdManager from '@/components/FacebookAdManager'

export default function Home() {
  const user = getAuthUser()
  if (!user) redirect('/login')
  return <FacebookAdManager initialUser={user} />
}
