import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSessionCookie, AuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_logins')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const user: AuthUser = {
      username: data.username,
      role: data.role || 'staff',
      displayName: data.display_name || data.username,
      permissions: data.permissions || 'all',
    }

    const sessionCookie = createSessionCookie(user)
    const response = NextResponse.json({ success: true, user })
    response.cookies.set('resort_session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return response
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('resort_session')
  return response
}
