import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calcRoomPrice, Room } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')

    if (!checkIn || !checkOut)
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const [{ data: rooms }, { data: bookings }] = await Promise.all([
      supabaseAdmin.from('rooms').select('*').order('id'),
      supabaseAdmin.from('bookings').select('room_id, check_in, check_out, status'),
    ])

    const result = (rooms || []).map((room: Room) => {
      if (room.status !== 'available') {
        return { ...room, available: false, reason: 'ปิดให้บริการ' }
      }
      const conflict = (bookings || []).some((b: {
        room_id: number; check_in: string; check_out: string; status: string
      }) => {
        if (b.status === 'cancelled' || b.status === 'checked_out') return false
        if (b.room_id !== room.id) return false
        return checkIn < b.check_out && checkOut > b.check_in
      })
      const priceInfo = calcRoomPrice(room, checkIn, checkOut)
      return {
        ...room,
        available: !conflict,
        reason: conflict ? 'ไม่ว่าง' : '',
        calculated_total: priceInfo.total,
        price_breakdown: priceInfo.breakdown,
      }
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
