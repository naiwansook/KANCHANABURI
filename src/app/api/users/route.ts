import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('user_logins')
    .select('id, username, role, display_name, permissions')
    .order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  try {
    const user = await req.json()
    if (user.id) {
      // Update
      const patch: Record<string, string> = {
        role: user.role || 'staff',
        display_name: user.display_name || user.username,
        permissions: user.permissions || 'all',
      }
      if (user.password) patch.password_hash = user.password
      const { error } = await supabaseAdmin.from('user_logins').update(patch).eq('id', user.id)
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    } else {
      // Create
      if (!user.password) return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 })
      const { data, error } = await supabaseAdmin.from('user_logins').insert({
        username: user.username,
        password_hash: user.password,
        role: user.role || 'staff',
        display_name: user.display_name || user.username,
        permissions: user.permissions || 'all',
      }).select().single()
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data.id })
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('user_logins').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
