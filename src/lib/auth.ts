import { cookies } from 'next/headers'

export interface AuthUser {
  username: string
  role: string
  displayName: string
  permissions: string
}

export function getAuthUser(): AuthUser | null {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('resort_session')?.value
    if (!session) return null
    return JSON.parse(Buffer.from(session, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

export function createSessionCookie(user: AuthUser): string {
  return Buffer.from(JSON.stringify(user)).toString('base64')
}
