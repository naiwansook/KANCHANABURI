// Thai holidays lookup
export function getThaiHolidays(year: number): Record<string, string> {
  const h: Record<string, string> = {}
  function add(mo: number, d: number, name: string) {
    h[`${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = name
  }
  add(1, 1, 'วันขึ้นปีใหม่')
  add(4, 6, 'วันจักรี')
  add(4, 13, 'วันสงกรานต์')
  add(4, 14, 'วันสงกรานต์')
  add(4, 15, 'วันสงกรานต์')
  add(5, 1, 'วันแรงงาน')
  add(5, 4, 'วันฉัตรมงคล')
  add(6, 3, 'วันเฉลิมฯ พระราชินี')
  add(7, 28, 'วันเฉลิมฯ ร.10')
  add(8, 12, 'วันแม่แห่งชาติ')
  add(10, 13, 'วันนวมินทรมหาราช')
  add(10, 23, 'วันปิยมหาราช')
  add(12, 5, 'วันพ่อแห่งชาติ')
  add(12, 10, 'วันรัฐธรรมนูญ')
  add(12, 31, 'วันสิ้นปี')

  const lunar: Record<number, Record<string, string>> = {
    2024: { makha: '2024-02-24', visakha: '2024-05-22', asanha: '2024-07-20', khao: '2024-07-21', ok: '2024-10-17' },
    2025: { makha: '2025-02-12', visakha: '2025-05-11', asanha: '2025-07-10', khao: '2025-07-11', ok: '2025-10-07' },
    2026: { makha: '2026-03-03', visakha: '2026-05-31', asanha: '2026-07-29', khao: '2026-07-30', ok: '2026-10-25' },
    2027: { makha: '2027-02-20', visakha: '2027-05-20', asanha: '2027-07-18', khao: '2027-07-19', ok: '2027-10-14' },
    2028: { makha: '2028-02-09', visakha: '2028-05-08', asanha: '2028-07-06', khao: '2028-07-07', ok: '2028-10-02' },
  }
  const lh = lunar[year]
  if (lh) {
    h[lh.makha] = 'วันมาฆบูชา'
    h[lh.visakha] = 'วันวิสาขบูชา'
    h[lh.asanha] = 'วันอาสาฬหบูชา'
    h[lh.khao] = 'วันเข้าพรรษา'
    h[lh.ok] = 'วันออกพรรษา'
  }
  return h
}

export interface PriceBreakdown {
  date: string
  price: number
  label: string
  dow: number
}

export interface RoomPriceResult {
  total: number
  nights: number
  breakdown: PriceBreakdown[]
}

export interface Room {
  id: number
  name: string
  bathroom_type: string
  price_per_night: number
  max_guests: number
  description: string
  status: string
  images: { url: string; fileId?: string }[]
  amenities: string
  extra_bed_price: number
  room_label: string
  weekend_price_fri: number
  weekend_price_sat: number
  weekend_price_sun: number
  holiday_price: number
  extra_bed_adult_price: number
  extra_bed_child_price: number
  extra_bed_adult_holiday_price: number
  extra_bed_child_holiday_price: number
}

export function calcRoomPrice(room: Room, checkIn: string, checkOut: string): RoomPriceResult {
  const ci = new Date(checkIn + 'T00:00:00')
  const co = new Date(checkOut + 'T00:00:00')
  const nights = Math.ceil((co.getTime() - ci.getTime()) / 86400000)
  const holidayCache: Record<number, Record<string, string>> = {}

  function getHol(y: number) {
    if (!holidayCache[y]) holidayCache[y] = getThaiHolidays(y)
    return holidayCache[y]
  }

  let total = 0
  const breakdown: PriceBreakdown[] = []

  for (let i = 0; i < nights; i++) {
    const d = new Date(ci.getTime() + i * 86400000)
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const dow = d.getDay()
    const y = d.getFullYear()
    const holidays = getHol(y)

    let price = room.price_per_night || 0
    let label = 'ปกติ'

    if (holidays[ds] && room.holiday_price) {
      price = room.holiday_price
      label = `วันหยุด (${holidays[ds]})`
    } else if (dow === 0 && room.weekend_price_sun) {
      price = room.weekend_price_sun
      label = 'วันอาทิตย์'
    } else if (dow === 6 && room.weekend_price_sat) {
      price = room.weekend_price_sat
      label = 'วันเสาร์'
    } else if (dow === 5 && room.weekend_price_fri) {
      price = room.weekend_price_fri
      label = 'วันศุกร์'
    }

    total += price
    breakdown.push({ date: ds, price, label, dow })
  }

  return { total, nights, breakdown }
}

export function calcExtraBedTotal(
  breakdown: PriceBreakdown[],
  ebAdult: number,
  ebChild: number,
  ebAdultP: number,
  ebChildP: number,
  ebAdultHolP: number,
  ebChildHolP: number
): number {
  let total = 0
  breakdown.forEach((b) => {
    const isHol = b.label && b.label !== 'ปกติ'
    const aP = isHol && ebAdultHolP ? ebAdultHolP : ebAdultP || 0
    const cP = isHol && ebChildHolP ? ebChildHolP : ebChildP || 0
    total += ebAdult * aP + ebChild * cP
  })
  return total
}

export function formatDate(date: string | Date | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatCurrency(v: number): string {
  return '฿' + (Number(v) || 0).toLocaleString()
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function monthStr(): string {
  return new Date().toISOString().substring(0, 7)
}
