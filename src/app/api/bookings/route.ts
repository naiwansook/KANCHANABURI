import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calcRoomPrice, calcExtraBedTotal, Room } from '@/lib/utils'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('id', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { booking, username, isPublic } = body

    // Fetch room
    const { data: roomData } = await supabaseAdmin.from('rooms').select('*').eq('id', booking.room_id).single()
    const room: Room | null = roomData

    const priceInfo = room ? calcRoomPrice(room, booking.check_in, booking.check_out) : { total: 0, nights: 0, breakdown: [] }
    const nights = priceInfo.nights
    const roomTotal = priceInfo.total

    const extraBedsAdult = Number(booking.extra_beds_adult) || Number(booking.extra_beds) || 0
    const extraBedsChild = Number(booking.extra_beds_child) || 0

    const ebAdultPrice = room ? room.extra_bed_adult_price || room.extra_bed_price || 0 : 0
    const ebChildPrice = room ? room.extra_bed_child_price || 0 : 0
    const ebAdultHolPrice = room ? room.extra_bed_adult_holiday_price || 0 : 0
    const ebChildHolPrice = room ? room.extra_bed_child_holiday_price || 0 : 0

    const extraBedTotal = calcExtraBedTotal(
      priceInfo.breakdown, extraBedsAdult, extraBedsChild,
      ebAdultPrice, ebChildPrice, ebAdultHolPrice, ebChildHolPrice
    )
    const totalBeds = extraBedsAdult + extraBedsChild
    const total = booking.total_price ? Number(booking.total_price) : roomTotal + extraBedTotal
    const deposit = Number(booking.deposit_amount) || 0
    const remaining = total - deposit

    const payload = {
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone || '',
      customer_email: booking.customer_email || '',
      customer_line: booking.customer_line || '',
      room_id: booking.room_id,
      room_name: room ? room.name : '',
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests || 1,
      nights,
      total_price: total,
      status: isPublic ? 'pending' : (booking.status || 'confirmed'),
      payment_status: deposit > 0 ? 'deposit' : 'unpaid',
      notes: booking.notes || '',
      created_by: username || 'ลูกค้า',
      deposit_amount: deposit,
      deposit_paid_at: deposit > 0 ? new Date().toISOString() : null,
      remaining_balance: remaining,
      extra_beds: totalBeds,
      extra_bed_total: extraBedTotal,
      extra_beds_adult: extraBedsAdult,
      extra_beds_child: extraBedsChild,
      booking_source: booking.booking_source || 'walkin',
    }

    const { data, error } = await supabaseAdmin.from('bookings').insert(payload).select().single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true, id: data.id, total_price: total, room_total: roomTotal,
      nights, deposit_amount: deposit, remaining_balance: remaining,
      room_name: room ? room.name : '', extra_beds: totalBeds,
      extra_beds_adult: extraBedsAdult, extra_beds_child: extraBedsChild,
      extra_bed_total: extraBedTotal, price_breakdown: priceInfo.breakdown,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Full record update (edit booking)
    if (updates.type === 'full') {
      const booking = updates.booking
      const { data: roomData } = await supabaseAdmin.from('rooms').select('*').eq('id', booking.room_id).single()
      const room: Room | null = roomData
      const priceInfo = room ? calcRoomPrice(room, booking.check_in, booking.check_out) : { total: 0, nights: 0, breakdown: [] }

      const ebA = Number(booking.extra_beds_adult) || 0
      const ebC = Number(booking.extra_beds_child) || 0
      const eaP = room ? room.extra_bed_adult_price || room.extra_bed_price || 0 : 0
      const ecP = room ? room.extra_bed_child_price || 0 : 0
      const eaHolP = room ? room.extra_bed_adult_holiday_price || 0 : 0
      const ecHolP = room ? room.extra_bed_child_holiday_price || 0 : 0
      const ebTotal = calcExtraBedTotal(priceInfo.breakdown, ebA, ebC, eaP, ecP, eaHolP, ecHolP)
      const total = booking.total_price ? Number(booking.total_price) : priceInfo.total + ebTotal
      const dep = Number(booking.deposit_amount) || 0

      const { error } = await supabaseAdmin.from('bookings').update({
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone || '',
        room_id: booking.room_id,
        room_name: room ? room.name : '',
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests || 1,
        nights: priceInfo.nights,
        total_price: total,
        notes: booking.notes || '',
        remaining_balance: total - dep,
        extra_beds: ebA + ebC,
        extra_bed_total: ebTotal,
        extra_beds_adult: ebA,
        extra_beds_child: ebC,
      }).eq('id', id)

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Status update
    if (updates.type === 'status') {
      const patch: Record<string, string> = {}
      if (updates.status) patch.status = updates.status
      if (updates.payment_status) {
        patch.payment_status = updates.payment_status
        if (updates.payment_status === 'paid') patch.remaining_balance = '0'
      }
      const { error } = await supabaseAdmin.from('bookings').update(patch).eq('id', id)
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Deposit update
    if (updates.type === 'deposit') {
      const dep = Number(updates.deposit_amount) || 0
      const { data: cur } = await supabaseAdmin.from('bookings').select('total_price').eq('id', id).single()
      const total = Number(cur?.total_price) || 0
      const remaining = total - dep
      const payStatus = dep >= total ? 'paid' : dep > 0 ? 'deposit' : 'unpaid'

      const { error } = await supabaseAdmin.from('bookings').update({
        deposit_amount: dep,
        deposit_paid_at: dep > 0 ? new Date().toISOString() : null,
        remaining_balance: remaining,
        payment_status: payStatus,
      }).eq('id', id)

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, remaining })
    }

    return NextResponse.json({ error: 'Unknown update type' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('bookings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
