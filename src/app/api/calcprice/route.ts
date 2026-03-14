import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calcRoomPrice, calcExtraBedTotal, Room } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('room_id')
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')
    const ebAdult = Number(searchParams.get('eb_adult')) || 0
    const ebChild = Number(searchParams.get('eb_child')) || 0

    if (!roomId || !checkIn || !checkOut)
      return NextResponse.json({ success: false, error: 'Missing params' }, { status: 400 })

    const { data: room, error } = await supabaseAdmin.from('rooms').select('*').eq('id', roomId).single()
    if (error || !room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })

    const r = room as Room
    const priceInfo = calcRoomPrice(r, checkIn, checkOut)
    const ebTotal = calcExtraBedTotal(
      priceInfo.breakdown, ebAdult, ebChild,
      r.extra_bed_adult_price || r.extra_bed_price || 0,
      r.extra_bed_child_price || 0,
      r.extra_bed_adult_holiday_price || 0,
      r.extra_bed_child_holiday_price || 0
    )

    return NextResponse.json({
      success: true,
      room_total: priceInfo.total,
      extra_bed_total: ebTotal,
      grand_total: priceInfo.total + ebTotal,
      nights: priceInfo.nights,
      breakdown: priceInfo.breakdown,
      eb_adult_price: r.extra_bed_adult_price || r.extra_bed_price || 0,
      eb_child_price: r.extra_bed_child_price || 0,
      eb_adult_hol_price: r.extra_bed_adult_holiday_price || 0,
      eb_child_hol_price: r.extra_bed_child_holiday_price || 0,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
