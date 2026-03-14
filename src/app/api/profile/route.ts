import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('resort_profile').select('*').single()
  if (error) return NextResponse.json({ name: 'Resort', image_url: '' })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json()
    const { data } = await supabaseAdmin.from('resort_profile').select('id').single()
    
    if (data?.id) {
      await supabaseAdmin.from('resort_profile').update({
        name: profile.name,
        image_url: profile.image_url || '',
        updated_at: new Date().toISOString(),
      }).eq('id', data.id)
    } else {
      await supabaseAdmin.from('resort_profile').insert({
        name: profile.name,
        image_url: profile.image_url || '',
      })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
