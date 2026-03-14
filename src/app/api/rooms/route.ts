import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  try {
    const room = await req.json()
    const payload = {
      name: room.name,
      bathroom_type: room.bathroom_type || 'private',
      price_per_night: Number(room.price_per_night) || 0,
      max_guests: Number(room.max_guests) || 2,
      description: room.description || '',
      status: room.status || 'available',
      images: room.images || [],
      amenities: room.amenities || '',
      extra_bed_price: Number(room.extra_bed_price) || 0,
      room_label: room.room_label || '',
      weekend_price_fri: Number(room.weekend_price_fri) || 0,
      weekend_price_sat: Number(room.weekend_price_sat) || 0,
      weekend_price_sun: Number(room.weekend_price_sun) || 0,
      holiday_price: Number(room.holiday_price) || 0,
      extra_bed_adult_price: Number(room.extra_bed_adult_price) || 0,
      extra_bed_child_price: Number(room.extra_bed_child_price) || 0,
      extra_bed_adult_holiday_price: Number(room.extra_bed_adult_holiday_price) || 0,
      extra_bed_child_holiday_price: Number(room.extra_bed_child_holiday_price) || 0,
    }

    if (room.id) {
      const { data, error } = await supabaseAdmin.from('rooms').update(payload).eq('id', room.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data.id })
    } else {
      const { data, error } = await supabaseAdmin.from('rooms').insert(payload).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data.id })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('rooms').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
