export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import LoginClient from '@/components/LoginClient'

export default function LoginPage() {
  const user = getAuthUser()
  if (user) redirect('/')
  return <LoginClient />
}
