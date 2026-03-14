'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { AuthUser } from '@/lib/auth'
import { getThaiHolidays, calcRoomPrice, calcExtraBedTotal, type Room, type PriceBreakdown } from '@/lib/utils'

// ─── helpers ────────────────────────────────────────────────
const E = (s: unknown) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const NF = (v: unknown) => (Number(v)||0).toLocaleString()
const fmt = (v: unknown) => '฿'+NF(v)

const STATUS_MAP: Record<string,string> = { pending:'รอยืนยัน', confirmed:'ยืนยัน', checked_in:'เช็คอิน', checked_out:'เช็คเอาท์', cancelled:'ยกเลิก' }
const STATUS_CLS: Record<string,string> = { pending:'st-pe', confirmed:'st-co', checked_in:'st-ci', checked_out:'st-cx', cancelled:'st-ca' }
const PAY_MAP: Record<string,string> = { paid:'ชำระแล้ว', unpaid:'ยังไม่ชำระ', deposit:'มัดจำ' }
const PAY_CLS: Record<string,string> = { paid:'st-pa', unpaid:'st-un', deposit:'st-dp' }

function StatusBadge({s}:{s:string}) { return <span className={`st ${STATUS_CLS[s]||''}`}>{STATUS_MAP[s]||s}</span> }
function PayBadge({s}:{s:string}) { return <span className={`st ${PAY_CLS[s]||''}`}>{PAY_MAP[s]||s}</span> }

interface Booking {
  id: number; customer_name: string; customer_phone: string; customer_email: string; customer_line: string;
  room_id: number; room_name: string; check_in: string; check_out: string;
  guests: number; nights: number; total_price: number; status: string; payment_status: string;
  notes: string; created_at: string; created_by: string;
  deposit_amount: number; deposit_paid_at: string|null; remaining_balance: number;
  extra_beds: number; extra_bed_total: number; extra_beds_adult: number; extra_beds_child: number;
  booking_source: string;
}
interface Transaction { id: number; date: string; category: string; type: string; amount: number; description: string; created_by: string }
interface Category { id: number; name: string; type: string; color: string }
interface User { id: number; username: string; role: string; display_name: string; permissions: string }
interface Profile { id: number; name: string; image_url: string }
interface BudgetItem { category_name: string; amount: number }
interface PriceCalcResult { bd: PriceBreakdown[]; rT: number; bT: number; np: number[]; ne: number[] }

interface RoomTab { roomId: string; ea: number; ec: number; dc: number; calc: PriceCalcResult|null; oi?: number }

// ─── PDF helpers ────────────────────────────────────────────
function buildPdfHtml(items: Booking[], pc: Record<string,string>, rooms: Room[]) {
  const f = items[0]
  const t = items.reduce((s,b) => s+(Number(b.total_price)||0), 0)
  const dp = items.reduce((s,b) => s+(Number(b.deposit_amount)||0), 0)
  const rm = t - dp
  const dn = (pc.prefix||'RCI')+(10000+(Number(f.id)||0))
  const ci = (f.check_in||'').split('-')
  const co = (f.check_out||'').split('-')
  const by = Number(ci[0]||0)+543, by2 = by%100
  const lg = pc.logo&&pc.logo.startsWith('data:') ? `<img src="${pc.logo}" style="max-height:55px;max-width:75px">` : ''
  const sg = pc.sig&&pc.sig.startsWith('data:') ? `<img src="${pc.sig}" style="max-height:35px">` : ''

  return `<div id="_pd" style="width:680px;padding:28px 36px;font-family:Prompt,sans-serif;font-size:11.5px;color:#1e3a5f;background:#fff">
<table style="width:100%;border-collapse:collapse"><tr>
<td style="width:90px;vertical-align:top">${lg}</td>
<td style="text-align:center"><div style="font-size:18px;font-weight:700">ใบยืนยันจองห้องพัก</div><div style="font-size:9px;color:#999">ต้นฉบับ</div></td>
<td style="width:170px;text-align:right;font-size:10px"><table style="border-collapse:collapse;margin-left:auto">
<tr><td style="padding:1px 6px;font-weight:600">เลขที่</td><td>${dn}</td></tr>
<tr><td style="padding:1px 6px;font-weight:600">วันที่</td><td>${ci[2]}/${ci[1]}/${by2}</td></tr>
<tr><td style="padding:1px 6px;font-weight:600">ชำระโดย</td><td>${pc.payMethod||'-'}</td></tr>
</table></td></tr></table>
<div style="margin-top:6px;font-size:10.5px"><strong>${E(pc.name||'')}</strong></div>
${pc.addr?`<div style="font-size:9.5px;color:#555">${E(pc.addr)}</div>`:''}
${pc.phone?`<div style="font-size:9.5px;color:#555">${E(pc.phone)}</div>`:''}
<div style="margin-top:10px;border-top:2px solid #2563eb;padding-top:8px">
<table style="width:100%;font-size:10.5px">
<tr><td><b>ลูกค้า</b></td><td style="text-align:right"><b>ผู้เข้าพัก</b> ${f.guests||2}</td></tr>
<tr><td>${E(f.customer_name||'')}</td><td style="text-align:right">Check in ${ci[2]}/${ci[1]}/${by2}</td></tr>
<tr><td>${E(f.customer_phone||'')}</td><td style="text-align:right">Check out ${co[2]}/${co[1]}/${by2}</td></tr>
</table></div>
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:10.5px">
<thead><tr style="background:#1e3a5f;color:#fff">
<th style="padding:5px 8px;text-align:left;border:1px solid #1e3a5f">No.</th>
<th style="padding:5px 8px;text-align:left;border:1px solid #1e3a5f">รายการ</th>
<th style="padding:5px 8px;text-align:center;border:1px solid #1e3a5f">คืน</th>
<th style="padding:5px 8px;text-align:right;border:1px solid #1e3a5f">ราคารวม</th>
</tr></thead><tbody>
${items.map((b,i) => `<tr style="background:${i%2===0?'#eff6ff':'#fff'}">
<td style="padding:5px 8px;border:1px solid #e2e8f0">${i+1}</td>
<td style="padding:5px 8px;border:1px solid #e2e8f0">ห้อง ${E(b.room_name||'')} (${ci[2]}/${ci[1]}/${by} – ${co[2]}/${co[1]}/${by})</td>
<td style="padding:5px 8px;text-align:center;border:1px solid #e2e8f0">${b.nights||1}</td>
<td style="padding:5px 8px;text-align:right;border:1px solid #e2e8f0">${NF(b.total_price)}</td>
</tr>`).join('')}
</tbody></table>
${pc.notes?`<div style="margin-top:12px;font-size:9.5px"><b>หมายเหตุ</b><div style="white-space:pre-line;color:#555;margin-top:3px">${E(pc.notes)}</div></div>`:''}
<table style="width:100%;margin-top:10px;font-size:11px"><tr><td style="width:55%"></td><td>
<table style="width:100%;border-collapse:collapse">
<tr><td style="padding:3px 6px;text-align:right;font-weight:600">รวม</td><td style="padding:3px 6px;text-align:right;font-weight:700">${NF(t)}</td></tr>
<tr><td style="padding:3px 6px;text-align:right;font-weight:600">มัดจำ</td><td style="padding:3px 6px;text-align:right">${NF(dp)}</td></tr>
<tr><td style="padding:3px 6px;text-align:right;font-weight:600">ยอดจ่ายวันเช็คอิน</td><td style="padding:3px 6px;text-align:right;color:#ef4444;font-weight:700">${NF(rm)}</td></tr>
<tr style="background:#1e3a5f;color:#fff"><td style="padding:5px 6px;text-align:right;font-weight:600">รวมทั้งสิ้น</td><td style="padding:5px 6px;text-align:right;font-weight:700;font-size:13px">${NF(t)}</td></tr>
</table></td></tr></table>
${pc.terms?`<div style="margin-top:10px;font-size:8.5px;border-top:1px solid #e2e8f0;padding-top:6px"><b>เงื่อนไข</b><div style="white-space:pre-line;color:#555;margin-top:3px">${E(pc.terms)}</div></div>`:''}
<div style="margin-top:28px;display:flex;justify-content:space-between;font-size:9.5px">
<div style="text-align:center;width:38%"><div>ในนาม ${E(f.customer_name||'')}</div><div style="height:35px"></div><div style="border-top:1px solid #999;padding-top:3px">ผู้จ่ายเงิน</div></div>
<div style="text-align:center;width:38%"><div>${pc.signer?E(pc.signer):''}</div><div style="margin-top:3px">${sg}</div><div style="border-top:1px solid #999;padding-top:3px">ผู้รับเงิน</div></div>
</div></div>`
}

// ─── Main Component ─────────────────────────────────────────
export default function DashboardClient({ initialUser }: { initialUser: AuthUser }) {
  const [page, setPage] = useState('da')
  const [sideCollapsed, setSideCollapsed] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Record<string, BudgetItem[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [profile, setProfile] = useState<Profile>({ id: 1, name: '', image_url: '' })
  const [loading, setLoading] = useState(true)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [dashMonth, setDashMonth] = useState(new Date().toISOString().substring(0, 7))
  const [txMonth, setTxMonth] = useState(new Date().toISOString().substring(0, 7))
  const [txType, setTxType] = useState('all')
  const [bFilter, setBFilter] = useState('all')
  const [bSearch, setBSearch] = useState('')
  const [rSearch, setRSearch] = useState('')
  const [budgetMonth, setBudgetMonth] = useState(new Date().toISOString().substring(0, 7))
  const [budgetRows, setBudgetRows] = useState<{name:string;amount:number}[]>([])
  const [pdfCfg, setPdfCfg] = useState<Record<string,string>>({})
  const today = new Date().toISOString().split('T')[0]

  // Modals
  const [modal, setModal] = useState<string|null>(null)
  const [modalData, setModalData] = useState<Record<string,unknown>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/appdata')
      const d = await res.json()
      setRooms(d.rooms || [])
      setBookings(d.bookings || [])
      setTransactions(d.transactions || [])
      setCategories(d.categories || [])
      setBudgets(d.budgets || {})
      setUsers(d.users || [])
      setProfile(d.profile || { id:1, name:'', image_url:'' })
    } catch(e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    try { const s = localStorage.getItem('pc3'); if(s) setPdfCfg(JSON.parse(s)) } catch {}
  }, [loadData])

  useEffect(() => {
    if (!loading && budgets[budgetMonth]) {
      setBudgetRows(budgets[budgetMonth].map(b => ({ name: b.category_name, amount: b.amount })))
    } else if (!loading) {
      setBudgetRows([])
    }
  }, [budgetMonth, budgets, loading])

  // ─── Navigation ─────────────────────────────────────────────
  const navItems = [
    { id:'da', icon:'chart-pie', label:'แดชบอร์ด' },
    { id:'bk', icon:'calendar-check', label:'การจอง' },
    { id:'cl', icon:'calendar-alt', label:'ปฏิทินห้องพัก' },
    { id:'rm', icon:'bed', label:'ห้องพัก' },
    { id:'tx', icon:'exchange-alt', label:'รายรับ-รายจ่าย' },
    { id:'ct', icon:'tags', label:'หมวดหมู่' },
    { id:'bu', icon:'wallet', label:'งบประมาณ' },
    { id:'pc', icon:'file-pdf', label:'จัดการใบจอง' },
    ...(initialUser.role === 'owner' || initialUser.role === 'admin' ? [{ id:'us', icon:'users-cog', label:'ผู้ใช้' }] : []),
    { id:'st', icon:'cog', label:'ตั้งค่า' },
  ]

  const pageTitles: Record<string,string> = {
    da:'แดชบอร์ด', bk:'การจอง', cl:'ปฏิทินห้องพัก', rm:'ห้องพัก',
    tx:'รายรับ-รายจ่าย', ct:'หมวดหมู่', bu:'งบประมาณ',
    pc:'จัดการใบจอง', us:'จัดการผู้ใช้', st:'ตั้งค่า',
  }

  // ─── Dashboard ───────────────────────────────────────────────
  const dmTx = transactions.filter(t => (t.date||'').startsWith(dashMonth))
  const dmBk = bookings.filter(b => (b.check_in||'').startsWith(dashMonth))
  const income = dmTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
  const expense = dmTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const outstanding = dmBk.filter(b=>b.payment_status!=='paid').reduce((s,b)=>s+(Number(b.remaining_balance)||0),0)

  // ─── Calendar ────────────────────────────────────────────────
  const availRooms = rooms.filter(r => r.status === 'available')
  const holidays = getThaiHolidays(calYear)

  function calDayInfo(ds: string) {
    const oc = availRooms.filter(r => bookings.some(b =>
      b.status!=='cancelled' && b.status!=='checked_out' && b.room_id===r.id && ds>=b.check_in && ds<b.check_out
    )).length
    return { oc, fr: availRooms.length - oc }
  }

  function renderCalendar() {
    const mn = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const first = new Date(calYear, calMonth, 1)
    const last = new Date(calYear, calMonth+1, 0)
    const startDay = (first.getDay() + 6) % 7
    const days = []

    for (let i = 0; i < startDay; i++) {
      const pd = new Date(calYear, calMonth, 0 - startDay + i + 1)
      days.push(<div key={`p${i}`} className="cd ot"><span className="dn">{pd.getDate()}</span></div>)
    }
    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(calYear, calMonth, d)
      const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dow = dt.getDay()
      const hn = holidays[ds] || ''
      const { oc, fr } = calDayInfo(ds)
      const isToday = ds === today
      let cls = 'cd'
      if (isToday) cls += ' td'
      if (hn) cls += ' hl'
      if (dow===6) cls += ' sa'
      if (dow===0) cls += ' su'

      days.push(
        <div key={d} className={cls} onClick={() => { setModalData({ ds, hn, fr, oc }); setModal('day') }}>
          <span className="dn">{d}</span>
          {hn && <div className="hn" title={hn}>{hn}</div>}
          {availRooms.length > 0 && (
            <div className="ca">
              {fr === 0 ? <span className="cf">เต็ม</span>
                : oc === 0 ? <span className="cv">ว่างทั้งหมด</span>
                : <span><span className="cv">ว่าง {fr}</span>/<span className="cf">จอง {oc}</span></span>}
            </div>
          )}
        </div>
      )
    }
    const endDay = (last.getDay() + 6) % 7
    for (let i = endDay + 1; i < 7; i++) {
      days.push(<div key={`n${i}`} className="cd ot"><span className="dn">{i-endDay}</span></div>)
    }
    return { title: `${mn[calMonth]} ${calYear+543}`, days }
  }

  // ─── Booking list ────────────────────────────────────────────
  const filteredBookings = bookings.filter(b => {
    if (bFilter !== 'all' && b.status !== bFilter) return false
    if (bSearch) {
      const s = bSearch.toLowerCase()
      return (b.customer_name||'').toLowerCase().includes(s) ||
             (b.customer_phone||'').includes(s) ||
             (b.room_name||'').toLowerCase().includes(s)
    }
    return true
  })

  // Group bookings by customer+dates
  const grouped: Record<string, Booking[]> = {}
  const groupOrder: string[] = []
  filteredBookings.forEach(b => {
    const k = `${b.customer_name}|${b.customer_phone}|${b.check_in}|${b.check_out}`
    if (!grouped[k]) { grouped[k] = []; groupOrder.push(k) }
    grouped[k].push(b)
  })

  // ─── Transactions ────────────────────────────────────────────
  const filteredTx = transactions.filter(t => {
    if (!(t.date||'').startsWith(txMonth)) return false
    if (txType !== 'all' && t.type !== txType) return false
    return true
  })
  const txIncome = filteredTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
  const txExpense = filteredTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const txMonths = [...new Set(transactions.map(t=>(t.date||'').substring(0,7)).filter(Boolean))].sort().reverse()
  if (!txMonths.includes(txMonth)) txMonths.unshift(txMonth)

  // ─── API calls ────────────────────────────────────────────────
  async function api(method: string, path: string, body?: unknown) {
    const res = await fetch(path, {
      method, headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return res.json()
  }

  async function deleteRoom(id: number) {
    if (!confirm('ลบห้องนี้?')) return
    await api('DELETE', `/api/rooms?id=${id}`)
    loadData()
  }
  async function deleteBooking(id: number) {
    if (!confirm(`ลบการจอง #${id}?`)) return
    await api('DELETE', `/api/bookings?id=${id}`)
    loadData()
  }
  async function deleteTx(id: number) {
    if (!confirm('ลบรายการนี้?')) return
    await api('DELETE', `/api/transactions?id=${id}`)
    loadData()
  }
  async function deleteCat(id: number) {
    if (!confirm('ลบหมวดหมู่?')) return
    await api('DELETE', `/api/categories?id=${id}`)
    loadData()
  }
  async function deleteUser(id: number) {
    if (!confirm('ลบผู้ใช้?')) return
    await api('DELETE', `/api/users?id=${id}`)
    loadData()
  }

  async function updateStatus(id: number, status?: string, paymentStatus?: string) {
    await api('PUT', '/api/bookings', { id, type:'status', status, payment_status: paymentStatus })
    loadData()
  }

  async function updateDeposit(id: number, amount: number) {
    await api('PUT', '/api/bookings', { id, type:'deposit', deposit_amount: amount })
    loadData()
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  // ─── Room save ───────────────────────────────────────────────
  async function saveRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      id: fd.get('id') ? Number(fd.get('id')) : undefined,
      name: fd.get('name'), bathroom_type: fd.get('bathroom_type'),
      price_per_night: Number(fd.get('price_per_night')),
      max_guests: Number(fd.get('max_guests')),
      description: fd.get('description'), status: fd.get('status'),
      amenities: fd.get('amenities'), room_label: fd.get('room_label'),
      weekend_price_fri: Number(fd.get('weekend_price_fri')),
      weekend_price_sat: Number(fd.get('weekend_price_sat')),
      weekend_price_sun: Number(fd.get('weekend_price_sun')),
      holiday_price: Number(fd.get('holiday_price')),
      extra_bed_adult_price: Number(fd.get('extra_bed_adult_price')),
      extra_bed_child_price: Number(fd.get('extra_bed_child_price')),
      extra_bed_adult_holiday_price: Number(fd.get('extra_bed_adult_holiday_price')),
      extra_bed_child_holiday_price: Number(fd.get('extra_bed_child_holiday_price')),
      images: modalData.images || [],
    }
    const r = await api('POST', '/api/rooms', payload)
    if (r.success) { setModal(null); loadData() } else alert(r.error)
  }

  // ─── Booking save ────────────────────────────────────────────
  const [bookingTabs, setBookingTabs] = useState<RoomTab[]>([{ roomId:'', ea:0, ec:0, dc:0, calc:null }])
  const [activeTab, setActiveTab] = useState(0)
  const [bkCI, setBkCI] = useState(today)
  const [bkCO, setBkCO] = useState('')
  const [bkDep, setBkDep] = useState(0)

  async function calcPrice(tab: RoomTab, ci: string, co: string, idx: number) {
    if (!tab.roomId || !ci || !co) return
    const p = new URLSearchParams({ room_id: tab.roomId, check_in: ci, check_out: co, eb_adult: String(tab.ea), eb_child: String(tab.ec) })
    const r = await fetch(`/api/calcprice?${p}`)
    const d = await r.json()
    if (d.success) {
      const np = d.breakdown.map((b: PriceBreakdown) => b.price)
      const ne = d.breakdown.map((b: PriceBreakdown) => {
        const isHol = b.label && b.label !== 'ปกติ'
        return tab.ea * (isHol && d.eb_adult_hol_price ? d.eb_adult_hol_price : d.eb_adult_price)
             + tab.ec * (isHol && d.eb_child_hol_price ? d.eb_child_hol_price : d.eb_child_price)
      })
      setBookingTabs(prev => {
        const next = [...prev]
        next[idx] = { ...next[idx], calc: { bd: d.breakdown, rT: d.room_total, bT: d.extra_bed_total, np, ne } }
        return next
      })
    }
  }

  function openBookingModal(editing?: Booking[]) {
    if (editing) {
      const f = editing[0]
      setBkCI(f.check_in); setBkCO(f.check_out); setBkDep(Number(f.deposit_amount)||0)
      setBookingTabs(editing.map(b => ({ roomId: String(b.room_id), ea: b.extra_beds_adult||0, ec: b.extra_beds_child||0, dc: 0, calc: null, oi: b.id })))
      setModalData({ editing: editing.map(b=>b.id), customerName: f.customer_name, customerPhone: f.customer_phone, guests: f.guests, notes: f.notes, source: f.booking_source })
    } else {
      setBkCI(today); setBkCO(''); setBkDep(0)
      setBookingTabs([{ roomId:'', ea:0, ec:0, dc:0, calc:null }])
      setModalData({})
    }
    setActiveTab(0)
    setModal('booking')
  }

  async function saveBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('customerName')||'').trim()
    const phone = String(fd.get('customerPhone')||'').trim()
    if (!name || !phone || !bkCI || !bkCO) { alert('กรอกข้อมูลให้ครบ'); return }

    const editingIds = modalData.editing as number[] | undefined
    const dn = bookingTabs.length

    for (let i = 0; i < bookingTabs.length; i++) {
      const tab = bookingTabs[i]
      if (!tab.roomId) { alert(`เลือกห้องสำหรับแท็บที่ ${i+1}`); return }

      const rT = tab.calc ? tab.calc.np.reduce((s,v)=>s+v,0) : 0
      const bT = tab.calc ? tab.calc.ne.reduce((s,v)=>s+v,0) : 0
      const total = rT + bT - (tab.dc||0)

      const bPayload = {
        customer_name: name, customer_phone: phone,
        customer_email: String(fd.get('customerEmail')||''),
        customer_line: String(fd.get('customerLine')||''),
        room_id: Number(tab.roomId),
        check_in: bkCI, check_out: bkCO,
        guests: Number(fd.get('guests')||2),
        extra_beds_adult: tab.ea, extra_beds_child: tab.ec,
        deposit_amount: i===0 ? bkDep : 0,
        total_price: total,
        notes: String(fd.get('notes')||'') + (dn>1 ? ` [กลุ่ม ${dn} ห้อง #${i+1}]` : ''),
        booking_source: String(fd.get('source')||'walkin'),
        status: 'confirmed',
      }

      if (editingIds?.[i]) {
        await api('PUT', '/api/bookings', { id: editingIds[i], type:'full', booking: bPayload })
      } else {
        await api('POST', '/api/bookings', { booking: bPayload, username: initialUser.username })
      }
    }
    setModal(null); loadData()
  }

  // ─── Tx save ─────────────────────────────────────────────────
  async function saveTx(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await api('POST', '/api/transactions', {
      transactions: [{ date: fd.get('date'), category: fd.get('category'), type: fd.get('type'), amount: Number(fd.get('amount')), description: fd.get('description') }],
      username: initialUser.username,
    })
    setModal(null); loadData()
  }

  // ─── Cat save ────────────────────────────────────────────────
  async function saveCat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const r = await api('POST', '/api/categories', { name: fd.get('name'), type: fd.get('type'), color: fd.get('color') })
    if (r.success) { setModal(null); loadData() } else alert(r.error)
  }

  // ─── User save ───────────────────────────────────────────────
  async function saveUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const id = fd.get('id')
    const r = await api('POST', '/api/users', {
      id: id ? Number(id) : undefined,
      username: fd.get('username'), password: fd.get('password'),
      display_name: fd.get('display_name'), role: fd.get('role'), permissions: fd.get('permissions'),
    })
    if (r.success) { setModal(null); loadData() } else alert(r.error)
  }

  // ─── Budget save ─────────────────────────────────────────────
  async function saveBudget() {
    const rows = budgetRows.filter(r => r.name)
    await api('POST', '/api/budgets', { month_year: budgetMonth, budgets: rows.map(r => ({ category_name: r.name, amount: r.amount })) })
    setBudgets(prev => ({ ...prev, [budgetMonth]: rows.map(r => ({ category_name: r.name, amount: r.amount })) }))
    alert('บันทึกแล้ว')
  }

  // ─── Profile save ────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await api('POST', '/api/profile', { name: fd.get('name'), image_url: fd.get('image_url') })
    alert('บันทึกแล้ว'); loadData()
  }

  // ─── PDF ─────────────────────────────────────────────────────
  async function generatePdf(items: Booking[]) {
    const jspdf = await import('jspdf')
    const h2c = await import('html2canvas')
    const html = buildPdfHtml(items, pdfCfg, rooms)
    const wrap = document.createElement('div')
    wrap.style.cssText = 'position:fixed;left:-9999px;top:0;font-family:Prompt,sans-serif'
    wrap.innerHTML = html
    document.body.appendChild(wrap)
    const el = wrap.querySelector('#_pd') as HTMLElement
    try {
      const canvas = await h2c.default(el, { scale: 2, useCORS: true, backgroundColor: '#fff' })
      document.body.removeChild(wrap)
      const img = canvas.toDataURL('image/jpeg', 0.95)
      const doc = new jspdf.jsPDF('p', 'mm', 'a4')
      const pw = 210, iw = pw - 20, ih = canvas.height * iw / canvas.width
      doc.addImage(img, 'JPEG', 10, 10, iw, Math.min(ih, 277))
      doc.save(`Booking_${items.map(b=>b.id).join('_')}.pdf`)
    } catch(e) { document.body.removeChild(wrap); alert('PDF error: '+e) }
  }

  // ─── Payment modal ───────────────────────────────────────────
  function openPayModal(ids: number[]) {
    const items = ids.map(id => bookings.find(b=>b.id===id)).filter(Boolean) as Booking[]
    const total = items.reduce((s,b)=>s+(Number(b.total_price)||0),0)
    const paid = items.reduce((s,b)=>s+(Number(b.deposit_amount)||0),0)
    setModalData({ payIds: ids, total, paid, remaining: total-paid })
    setModal('pay')
  }

  async function applyPayment(pct: number | 'custom') {
    const ids = modalData.payIds as number[]
    const total = modalData.total as number
    for (const id of ids) {
      const b = bookings.find(x=>x.id===id)!
      const bt = Number(b.total_price)||0
      const amount = pct === 'custom'
        ? Math.round((Number(prompt('ระบุจำนวน (฿):')) || 0) / ids.length)
        : Math.round(bt * (pct/100))
      if (amount > 0) await updateDeposit(id, amount)
    }
    setModal(null); loadData()
  }

  // ─── Room images state ───────────────────────────────────────
  const [roomImages, setRoomImages] = useState<{url:string;fileId?:string}[]>([])

  // ─── Render ──────────────────────────────────────────────────
  const cal = renderCalendar()

  if (loading) return (
    <div id="AL" style={{ display:'flex' }}>
      <div className="spinner" style={{ width:36,height:36,borderColor:'#dbeafe',borderTopColor:'#2563eb',marginBottom:12 }} />
      <p style={{ color:'#64748b' }}>กำลังโหลด...</p>
    </div>
  )

  const bookingUrl = typeof window !== 'undefined' ? `${window.location.origin}/booking` : '/booking'

  return (
    <>
      {/* ── Sidebar ── */}
      <div className={`sd ${sideCollapsed ? 'c' : ''}`}>
        <div className="sd-h">
          <div className="logo-icon"><i className="fas fa-hotel" /></div>
          <span className="logo-text">Resort Manager</span>
        </div>
        <div className="sd-n">
          {navItems.map(n => (
            <div key={n.id} className={`sn ${page===n.id?'on':''}`} onClick={() => setPage(n.id)}>
              <i className={`fas fa-${n.icon}`} />
              <span className="nl">{n.label}</span>
            </div>
          ))}
        </div>
        <div className="sd-f">
          <div className="ui-bar">
            <div className="ui-av">{(initialUser.displayName||'A').charAt(0).toUpperCase()}</div>
            <div>
              <div className="ui-name" style={{ fontSize:'0.83rem',fontWeight:600,color:'#fff' }}>{initialUser.displayName}</div>
              <div style={{ fontSize:'0.72rem',color:'rgba(255,255,255,0.5)',cursor:'pointer' }} onClick={logout}>ออกจากระบบ</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className={`mn ${sideCollapsed ? '' : ''}`} style={{ marginLeft: sideCollapsed ? 'var(--sc)' : 'var(--sw)' }}>
        <div className="tb2">
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <button className="tbtn" onClick={() => setSideCollapsed(p => !p)}><i className="fas fa-bars" /></button>
            <h4>{pageTitles[page] || page}</h4>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <span style={{ color:'var(--sb)',fontSize:'0.82rem' }}>{new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
            <button className="bp" style={{ background:'#ef4444',padding:'6px 14px',fontSize:'0.8rem' }} onClick={logout}><i className="fas fa-sign-out-alt me-1" />ออก</button>
          </div>
        </div>

        {/* ════ DASHBOARD ════ */}
        {page==='da' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8 }}>
              <h5 style={{ margin:0,fontWeight:700,color:'var(--p1)' }}><i className="fas fa-chart-pie me-2" />แดชบอร์ด</h5>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <label style={{ fontWeight:600,fontSize:'0.85rem',color:'var(--p1)',marginBottom:0 }}>เดือน:</label>
                <input type="month" className="form-control" style={{ width:'auto' }} value={dashMonth} onChange={e=>setDashMonth(e.target.value)} />
              </div>
            </div>
            <div className="row g-3 mb-3">
              {[
                { v: rooms.length, l:'ห้องพัก', c:'var(--p2)' },
                { v: dmBk.length, l:'จองเดือนนี้', c:'var(--warn)' },
                { v: fmt(income), l:'รายได้', c:'var(--ok)' },
                { v: fmt(expense), l:'รายจ่าย', c:'var(--err)' },
                { v: fmt(income-expense), l:'กำไรสุทธิ', c: income>=expense?'var(--ok)':'var(--err)' },
                { v: fmt(outstanding), l:'ค้างชำระ', c:'var(--warn)' },
              ].map(({ v,l,c }) => (
                <div key={l} className="col-6 col-2">
                  <div className="kp">
                    <div className="kv" style={{ color:c }}>{v}</div>
                    <div className="kl">{l}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <div className="cs">
                  <h5><i className="fas fa-arrow-circle-down me-2 text-success" />รายได้ตามหมวด</h5>
                  <DoughnutChart data={dmTx.filter(t=>t.type==='income')} cats={categories} />
                </div>
              </div>
              <div className="col-6">
                <div className="cs">
                  <h5><i className="fas fa-arrow-circle-up me-2 text-danger" />รายจ่ายตามหมวด</h5>
                  <DoughnutChart data={dmTx.filter(t=>t.type==='expense')} cats={categories} />
                </div>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-8">
                <div className="cs">
                  <h5><i className="fas fa-clock me-2" style={{ color:'var(--p3)' }} />จองล่าสุด</h5>
                  <div className="table-responsive">
                    <table className="t1 table"><thead><tr><th>#</th><th>ลูกค้า</th><th>ห้อง</th><th>เช็คอิน</th><th>สถานะ</th><th>ราคา</th></tr></thead>
                    <tbody>
                      {bookings.slice(0,6).map(b => (
                        <tr key={b.id}><td>{b.id}</td><td>{b.customer_name}</td><td>{b.room_name}</td><td>{b.check_in}</td><td><StatusBadge s={b.status} /></td><td className="fw-bold">{fmt(b.total_price)}</td></tr>
                      ))}
                    </tbody></table>
                  </div>
                </div>
              </div>
              <div className="col-4">
                <div className="cs">
                  <h5><i className="fas fa-link me-2" style={{ color:'var(--p3)' }} />ลิงก์จอง</h5>
                  <div className="input-group">
                    <input type="text" className="form-control" value={bookingUrl} readOnly style={{ fontSize:'0.78rem' }} />
                    <button className="bp" onClick={() => navigator.clipboard.writeText(bookingUrl)}><i className="fas fa-copy" /></button>
                  </div>
                </div>
                <div className="cs mt-2">
                  <h5><i className="fas fa-door-open me-2" style={{ color:'var(--ok)' }} />สถานะห้อง</h5>
                  {rooms.map(r => {
                    const occ = bookings.some(b => b.status!=='cancelled'&&b.status!=='checked_out'&&b.room_id===r.id&&today>=b.check_in&&today<b.check_out)
                    return (
                      <div key={r.id} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--bd)' }}>
                        <span style={{ fontSize:'0.83rem' }}>{r.name}</span>
                        <span className={`st ${r.status!=='available'?'st-ca':occ?'st-pe':'st-co'}`}>
                          {r.status!=='available'?'ปิด':occ?'เข้าพัก':'ว่าง'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ BOOKINGS ════ */}
        {page==='bk' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:14 }}>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <div className="sh">
                  <i className="fas fa-search si" />
                  <input type="text" className="form-control" style={{ width:200 }} placeholder="ค้นหา..." value={bSearch} onChange={e=>setBSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width:'auto' }} value={bFilter} onChange={e=>setBFilter(e.target.value)}>
                  <option value="all">ทั้งหมด</option>
                  <option value="pending">รอยืนยัน</option>
                  <option value="confirmed">ยืนยัน</option>
                  <option value="checked_in">เช็คอิน</option>
                  <option value="checked_out">เช็คเอาท์</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
              <button className="bp" onClick={() => openBookingModal()}><i className="fas fa-plus me-1" />สร้างการจอง</button>
            </div>

            {groupOrder.length === 0 && <div className="es"><i className="fas fa-calendar-check" /><p>ไม่มีข้อมูลการจอง</p></div>}

            {groupOrder.map(k => {
              const items = grouped[k]; const f = items[0]; const multi = items.length > 1
              const tp = items.reduce((s,b)=>s+(Number(b.total_price)||0),0)
              const dp2 = items.reduce((s,b)=>s+(Number(b.deposit_amount)||0),0)
              const rem = tp - dp2
              const hasDebt = rem > 0 && items.some(b=>b.payment_status!=='paid')
              return (
                <div key={k} className={`bk ${hasDebt?'hd':''}`}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                        <strong style={{ fontSize:'0.95rem',color:'var(--p1)' }}>{f.customer_name}</strong>
                        {multi && <span className="st" style={{ background:'var(--p5)',color:'var(--p2)' }}>{items.length} ห้อง</span>}
                        <StatusBadge s={f.status} />
                      </div>
                      <div style={{ color:'var(--sb)',fontSize:'0.82rem' }}>
                        <i className="fas fa-phone me-1" />{f.customer_phone} &nbsp;
                        <i className="fas fa-calendar me-1" />{f.check_in} → {f.check_out} ({f.nights} คืน)
                      </div>
                      <div className="bk-r">{items.map(b=><span key={b.id} className="bk-t"><i className="fas fa-bed me-1" />{b.room_name}</span>)}</div>
                      {hasDebt && <div className="bk-d"><i className="fas fa-exclamation-triangle" style={{ color:'var(--warn)' }} />ค้างชำระ <strong style={{ color:'var(--err)' }}>{fmt(rem)}</strong></div>}
                    </div>
                    <div style={{ textAlign:'right',minWidth:170 }}>
                      <div style={{ fontSize:'1.1rem',fontWeight:700,color:'var(--p1)' }}>{fmt(tp)}</div>
                      {dp2>0 && <div style={{ fontSize:'0.78rem',color:'var(--ok)' }}>มัดจำ {fmt(dp2)}</div>}
                      <div style={{ display:'flex',gap:4,marginTop:6,justifyContent:'flex-end' }}>
                        <button className="bi" style={{ borderColor:'#10b981',color:'#10b981' }} title="ชำระเงิน" onClick={() => openPayModal(items.map(b=>b.id))}><i className="fas fa-money-bill-wave" /></button>
                        <button className="bi" style={{ borderColor:'#f59e0b',color:'#f59e0b' }} title="PDF" onClick={() => generatePdf(items)}><i className="fas fa-file-pdf" /></button>
                        {items.some(b=>b.status==='confirmed') && <button className="bi" style={{ borderColor:'var(--p2)',color:'var(--p2)' }} title="เช็คอิน" onClick={() => updateStatus(items[0].id,'checked_in')}><i className="fas fa-sign-in-alt" /></button>}
                        {items.some(b=>b.status==='checked_in') && <button className="bi" style={{ borderColor:'#64748b',color:'#64748b' }} title="เช็คเอาท์" onClick={() => updateStatus(items[0].id,'checked_out')}><i className="fas fa-sign-out-alt" /></button>}
                        <button className="bi" style={{ borderColor:'var(--p2)',color:'var(--p2)' }} title="แก้ไข" onClick={() => openBookingModal(items)}><i className="fas fa-edit" /></button>
                        <button className="bi" style={{ borderColor:'var(--err)',color:'var(--err)' }} title="ลบ" onClick={() => items.forEach(b=>deleteBooking(b.id))}><i className="fas fa-trash" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ════ CALENDAR ════ */}
        {page==='cl' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <button className="bp" style={{ background:'var(--p5)',color:'var(--p2)',padding:'6px 12px' }} onClick={() => { let m=calMonth-1,y=calYear; if(m<0){m=11;y--} setCalMonth(m);setCalYear(y) }}><i className="fas fa-chevron-left" /></button>
                <h5 style={{ margin:'0 12px',fontWeight:700,color:'var(--p1)',minWidth:160,textAlign:'center' }}>{cal.title}</h5>
                <button className="bp" style={{ background:'var(--p5)',color:'var(--p2)',padding:'6px 12px' }} onClick={() => { let m=calMonth+1,y=calYear; if(m>11){m=0;y++} setCalMonth(m);setCalYear(y) }}><i className="fas fa-chevron-right" /></button>
              </div>
              <div style={{ display:'flex',gap:6 }}>
                <span className="st st-co">ว่าง</span>
                <span className="st st-ca">เต็ม</span>
                <span className="st st-pe">หยุด</span>
              </div>
            </div>
            <div className="cs p-2">
              <div className="cg">
                {['จ','อ','พ','พฤ','ศ','ส','อา'].map((d,i) => <div key={d} className={`ch ${i>=5?'we':''}`}>{d}</div>)}
              </div>
              <div className="cg">{cal.days}</div>
            </div>
          </div>
        )}

        {/* ════ ROOMS ════ */}
        {page==='rm' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div className="sh">
                <i className="fas fa-search si" />
                <input type="text" className="form-control" style={{ width:200 }} placeholder="ค้นหาห้อง..." value={rSearch} onChange={e=>setRSearch(e.target.value)} />
              </div>
              <button className="bp" onClick={() => { setRoomImages([]); setModalData({}); setModal('room') }}><i className="fas fa-plus me-1" />เพิ่มห้อง</button>
            </div>
            {rooms.filter(r=>!rSearch||(r.name||'').toLowerCase().includes(rSearch.toLowerCase())).length === 0 && (
              <div className="es"><i className="fas fa-bed" /><p>ไม่มีห้องพัก</p></div>
            )}
            <div className="row g-3">
              {rooms.filter(r=>!rSearch||(r.name||'').toLowerCase().includes(rSearch.toLowerCase())).map(r => (
                <div key={r.id} className="col-4" style={{ minWidth:260 }}>
                  <div className="cs p-0" style={{ overflow:'hidden' }}>
                    {(r.images||[]).length ? <img src={r.images[0].url} alt={r.name} style={{ width:'100%',height:140,objectFit:'cover' }} />
                      : <div style={{ height:100,background:'var(--p6)',display:'flex',alignItems:'center',justifyContent:'center' }}><i className="fas fa-image fa-2x" style={{ color:'var(--p4)' }} /></div>}
                    <div style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                        <h6 style={{ fontWeight:700,margin:0,fontSize:'0.9rem' }}>{r.name}</h6>
                        <span className={`st ${r.status==='available'?'st-co':'st-ca'}`}>{r.status==='available'?'พร้อม':'ปิด'}</span>
                      </div>
                      <div style={{ fontSize:'0.82rem',color:'var(--sb)',marginBottom:6 }}><i className="fas fa-user me-1" />{r.max_guests} คน</div>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                        <span style={{ fontWeight:700,color:'var(--p2)' }}>{fmt(r.price_per_night)}/คืน</span>
                        <div style={{ display:'flex',gap:4 }}>
                          <button className="bi" style={{ borderColor:'var(--p2)',color:'var(--p2)' }} onClick={() => { setRoomImages([...(r.images||[])]); setModalData({ editing: r }); setModal('room') }}><i className="fas fa-edit" /></button>
                          <button className="bi" style={{ borderColor:'var(--err)',color:'var(--err)' }} onClick={() => deleteRoom(r.id)}><i className="fas fa-trash" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ TRANSACTIONS ════ */}
        {page==='tx' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:14 }}>
              <div style={{ display:'flex',gap:8 }}>
                <select className="form-select" style={{ width:'auto' }} value={txMonth} onChange={e=>setTxMonth(e.target.value)}>
                  {txMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="form-select" style={{ width:'auto' }} value={txType} onChange={e=>setTxType(e.target.value)}>
                  <option value="all">ทั้งหมด</option>
                  <option value="income">รายรับ</option>
                  <option value="expense">รายจ่าย</option>
                </select>
              </div>
              <button className="bp" onClick={() => setModal('tx')}><i className="fas fa-plus me-1" />เพิ่ม</button>
            </div>
            <div className="row g-3 mb-3">
              {[{ v:fmt(txIncome),l:'รายรับ',c:'text-success'},{v:fmt(txExpense),l:'รายจ่าย',c:'text-danger'},{v:fmt(txIncome-txExpense),l:'คงเหลือ',c:txIncome>=txExpense?'text-success':'text-danger'}].map(({v,l,c})=>(
                <div key={l} className="col-4"><div className="kp"><div className="kl">{l}</div><div className={`kv ${c}`}>{v}</div></div></div>
              ))}
            </div>
            <div className="cs p-0">
              <div className="table-responsive" style={{ maxHeight:'55vh' }}>
                <table className="t1 table"><thead><tr><th>วันที่</th><th>หมวด</th><th>ประเภท</th><th>จำนวน</th><th>รายละเอียด</th><th>โดย</th><th></th></tr></thead>
                <tbody>
                  {filteredTx.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center',padding:24,color:'var(--sb)' }}>-</td></tr>}
                  {filteredTx.map(t => (
                    <tr key={t.id}>
                      <td>{t.date}</td><td>{t.category}</td>
                      <td><span className={`st ${t.type==='income'?'st-co':'st-ca'}`}>{t.type==='income'?'รายรับ':'รายจ่าย'}</span></td>
                      <td className="fw-bold">{fmt(t.amount)}</td>
                      <td style={{ color:'var(--sb)',fontSize:'0.82rem' }}>{t.description}</td>
                      <td style={{ color:'var(--sb)',fontSize:'0.82rem' }}>{t.created_by}</td>
                      <td><button className="bi" style={{ borderColor:'var(--err)',color:'var(--err)' }} onClick={()=>deleteTx(t.id)}><i className="fas fa-trash" /></button></td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ════ CATEGORIES ════ */}
        {page==='ct' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <h6 style={{ margin:0,fontWeight:700,color:'var(--p1)' }}>หมวดหมู่</h6>
              <button className="bp" style={{ padding:'6px 16px' }} onClick={()=>setModal('cat')}><i className="fas fa-plus me-1" />เพิ่ม</button>
            </div>
            <div className="row g-3">
              {categories.map(c => (
                <div key={c.id} className="col-4" style={{ minWidth:180 }}>
                  <div className="cs" style={{ textAlign:'center' }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:c.color,margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <i className="fas fa-tag" style={{ color:'#fff',fontSize:'0.85rem' }} />
                    </div>
                    <h6 style={{ fontWeight:700,fontSize:'0.88rem',marginBottom:4 }}>{c.name}</h6>
                    <span className={`st ${c.type==='income'?'st-co':'st-ca'}`}>{c.type==='income'?'รายรับ':'รายจ่าย'}</span>
                    <div style={{ marginTop:8 }}>
                      <button className="bi" style={{ borderColor:'var(--err)',color:'var(--err)' }} onClick={()=>deleteCat(c.id)}><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ BUDGETS ════ */}
        {page==='bu' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <label style={{ fontWeight:600,fontSize:'0.85rem',marginBottom:0 }}>เดือน:</label>
                <input type="month" className="form-control" style={{ width:'auto' }} value={budgetMonth} onChange={e=>setBudgetMonth(e.target.value)} />
              </div>
              <button className="bp" style={{ padding:'6px 16px' }} onClick={()=>setBudgetRows(p=>[...p,{name:'',amount:0}])}><i className="fas fa-plus me-1" />เพิ่ม</button>
            </div>
            <div className="cs">
              <div className="table-responsive">
                <table className="t1 table"><thead><tr><th>หมวด</th><th>งบ</th><th>ใช้จริง</th><th>เหลือ</th><th>%</th><th></th></tr></thead>
                <tbody>
                  {budgetRows.length===0 && <tr><td colSpan={6} style={{ textAlign:'center',padding:24,color:'var(--sb)' }}>-</td></tr>}
                  {budgetRows.map((b,i) => {
                    const used = filteredTx.filter(t=>t.category===b.name&&t.type==='expense').reduce((s,t)=>s+t.amount,0)
                    const rem = b.amount - used
                    const pct = b.amount>0 ? Math.min(Math.round(used/b.amount*100),100) : 0
                    const color = pct>90?'var(--err)':pct>70?'var(--warn)':'var(--ok)'
                    return (
                      <tr key={i}>
                        <td><input className="form-control" style={{ minWidth:120 }} value={b.name} onChange={e=>setBudgetRows(p=>{const n=[...p];n[i]={...n[i],name:e.target.value};return n})} /></td>
                        <td><input type="number" className="form-control" style={{ width:100 }} value={b.amount} onChange={e=>setBudgetRows(p=>{const n=[...p];n[i]={...n[i],amount:Number(e.target.value)};return n})} /></td>
                        <td>{fmt(used)}</td>
                        <td style={{ color,fontWeight:700 }}>{fmt(rem)}</td>
                        <td>
                          <div className="progress" style={{ height:6,width:80 }}><div className="progress-bar" style={{ width:`${pct}%`,background:color }} /></div>
                          <small>{pct}%</small>
                        </td>
                        <td><button className="bi" style={{ borderColor:'var(--err)',color:'var(--err)' }} onClick={()=>setBudgetRows(p=>p.filter((_,j)=>j!==i))}><i className="fas fa-trash" /></button></td>
                      </tr>
                    )
                  })}
                </tbody></table>
              </div>
              <button className="bp" style={{ background:'var(--ok)',marginTop:12 }} onClick={saveBudget}><i className="fas fa-save me-1" />บันทึก</button>
            </div>
          </div>
        )}

        {/* ════ PDF CONFIG ════ */}
        {page==='pc' && (
          <div className="cs">
            <h5><i className="fas fa-file-pdf me-2" style={{ color:'var(--err)' }} />ตั้งค่าใบยืนยันจอง</h5>
            <div className="row g-3">
              {[['name','ชื่อกิจการ'],['prefix','Prefix เอกสาร'],['phone','เบอร์โทร'],['fb','Facebook'],['email','Email'],['signer','ผู้ลงนาม'],['payMethod','ช่องทางชำระ']].map(([k,l])=>(
                <div key={k} className="col-6">
                  <label className="form-label">{l}</label>
                  <input type="text" className="form-control" value={pdfCfg[k]||''} onChange={e=>setPdfCfg(p=>({...p,[k]:e.target.value}))} />
                </div>
              ))}
              <div className="col-12">
                <label className="form-label">ที่อยู่</label>
                <textarea className="form-control" rows={2} value={pdfCfg.addr||''} onChange={e=>setPdfCfg(p=>({...p,addr:e.target.value}))} />
              </div>
              <div className="col-12">
                <label className="form-label">หมายเหตุ</label>
                <textarea className="form-control" rows={2} value={pdfCfg.notes||''} onChange={e=>setPdfCfg(p=>({...p,notes:e.target.value}))} />
              </div>
              <div className="col-12">
                <label className="form-label">เงื่อนไข</label>
                <textarea className="form-control" rows={3} value={pdfCfg.terms||''} onChange={e=>setPdfCfg(p=>({...p,terms:e.target.value}))} />
              </div>
            </div>
            <button className="bp" style={{ marginTop:14 }} onClick={() => { localStorage.setItem('pc3',JSON.stringify(pdfCfg)); alert('บันทึกแล้ว') }}><i className="fas fa-save me-1" />บันทึก</button>
          </div>
        )}

        {/* ════ USERS ════ */}
        {page==='us' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <h6 style={{ margin:0 }}>จัดการผู้ใช้</h6>
              <button className="bp" style={{ padding:'6px 16px' }} onClick={() => { setModalData({}); setModal('user') }}><i className="fas fa-plus me-1" />เพิ่ม</button>
            </div>
            <div className="cs p-0">
              <div className="table-responsive">
                <table className="t1 table"><thead><tr><th>Username</th><th>ชื่อ</th><th>บทบาท</th><th>สิทธิ์</th><th></th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.username}</td><td>{u.display_name}</td>
                      <td><span className={`st ${u.role==='owner'?'st-ca':u.role==='admin'?'st-dp':'st-ci'}`}>{u.role}</span></td>
                      <td style={{ color:'var(--sb)',fontSize:'0.82rem' }}>{u.permissions||'all'}</td>
                      <td>
                        <div style={{ display:'flex',gap:4 }}>
                          <button className="bi" style={{ borderColor:'var(--p2)',color:'var(--p2)' }} onClick={()=>{setModalData({user:u});setModal('user')}}><i className="fas fa-edit" /></button>
                          <button className="bi" style={{ borderColor:'var(--err)',color:'var(--err)' }} onClick={()=>deleteUser(u.id)}><i className="fas fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {page==='st' && (
          <div>
            <div className="cs">
              <h5><i className="fas fa-user-circle me-2" style={{ color:'var(--p2)' }} />โปรไฟล์รีสอร์ท</h5>
              <form onSubmit={saveProfile}>
                <div className="row g-3">
                  <div className="col-6"><label className="form-label">ชื่อรีสอร์ท</label><input type="text" name="name" className="form-control" defaultValue={profile.name} /></div>
                  <div className="col-6"><label className="form-label">โลโก้ URL</label><input type="text" name="image_url" className="form-control" defaultValue={profile.image_url} /></div>
                </div>
                <button type="submit" className="bp" style={{ marginTop:12 }}><i className="fas fa-save me-1" />บันทึก</button>
              </form>
            </div>
            <div className="cs">
              <h5><i className="fas fa-link me-2" style={{ color:'var(--p3)' }} />ลิงก์จองออนไลน์</h5>
              <div className="input-group">
                <input type="text" className="form-control" value={bookingUrl} readOnly />
                <button className="bp" onClick={() => { navigator.clipboard.writeText(bookingUrl); alert('คัดลอกแล้ว!') }}><i className="fas fa-copy" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════ MODALS ════ */}

      {/* Day detail modal */}
      {modal==='day' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><h5><i className="fas fa-calendar-day me-2" />{modalData.ds as string} {modalData.hn ? `- ${modalData.hn}` : ''}</h5><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <div className="modal-body">
              <div style={{ marginBottom:8,fontWeight:600 }}>ห้องว่าง: {modalData.fr as number} / จอง: {modalData.oc as number}</div>
              {availRooms.map(r => {
                const b = bookings.find(b => b.status!=='cancelled'&&b.status!=='checked_out'&&b.room_id===r.id&&(modalData.ds as string)>=b.check_in&&(modalData.ds as string)<b.check_out)
                return <div key={r.id} className={`dr ${b?'oc':'fr'}`}><span><i className="fas fa-bed me-1" />{r.name}</span><span>{b?`จอง: ${b.customer_name}`:'ว่าง'}</span></div>
              })}
            </div>
          </div>
        </div>
      )}

      {/* Room modal */}
      {modal==='room' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box modal-lg" onClick={e=>e.stopPropagation()} style={{ maxHeight:'90vh' }}>
            <div className="modal-hd"><h5><i className="fas fa-bed me-2" />{modalData.editing ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่'}</h5><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <form onSubmit={saveRoom}>
              <div className="modal-body">
                <input type="hidden" name="id" value={(modalData.editing as Room)?.id||''} />
                <div className="row g-3">
                  <div className="col-6"><label className="form-label">ชื่อห้อง *</label><input type="text" name="name" className="form-control" required defaultValue={(modalData.editing as Room)?.name||''} /></div>
                  <div className="col-3"><label className="form-label">ป้ายกำกับ</label><input type="text" name="room_label" className="form-control" defaultValue={(modalData.editing as Room)?.room_label||''} /></div>
                  <div className="col-3"><label className="form-label">ห้องน้ำ</label>
                    <select name="bathroom_type" className="form-select" defaultValue={(modalData.editing as Room)?.bathroom_type||'private'}>
                      <option value="private">ในตัว</option><option value="separate">แยก</option><option value="shared">รวม</option>
                    </select>
                  </div>
                  {[['price_per_night','ราคา/คืน'],['weekend_price_fri','ศุกร์'],['weekend_price_sat','เสาร์'],['weekend_price_sun','อาทิตย์'],['holiday_price','วันหยุด'],['max_guests','ผู้เข้าพักสูงสุด'],['extra_bed_adult_price','เตียงผู้ใหญ่'],['extra_bed_child_price','เตียงเด็ก'],['extra_bed_adult_holiday_price','เตียงผญ.(หยุด)'],['extra_bed_child_holiday_price','เตียงเด็ก(หยุด)']].map(([k,l])=>(
                    <div key={k} className="col-3"><label className="form-label">{l}</label><input type="number" name={k} className="form-control" defaultValue={(modalData.editing as Record<string,unknown>)?.[k] as number||0} min={0} /></div>
                  ))}
                  <div className="col-6"><label className="form-label">สิ่งอำนวย</label><input type="text" name="amenities" className="form-control" placeholder="แอร์,ทีวี,ตู้เย็น" defaultValue={(modalData.editing as Room)?.amenities||''} /></div>
                  <div className="col-6"><label className="form-label">สถานะ</label>
                    <select name="status" className="form-select" defaultValue={(modalData.editing as Room)?.status||'available'}>
                      <option value="available">พร้อมให้บริการ</option><option value="maintenance">ซ่อมบำรุง</option><option value="unavailable">ปิด</option>
                    </select>
                  </div>
                  <div className="col-12"><label className="form-label">รายละเอียด</label><textarea name="description" className="form-control" rows={2} defaultValue={(modalData.editing as Room)?.description||''} /></div>
                  <div className="col-12">
                    <label className="form-label">รูปภาพ URL (เพิ่มทีละรูป)</label>
                    <div style={{ display:'flex',gap:8,marginBottom:8 }}>
                      <input type="text" id="imgUrlInput" className="form-control" placeholder="https://..." />
                      <button type="button" className="bp" onClick={() => {
                        const inp = document.getElementById('imgUrlInput') as HTMLInputElement
                        if (inp.value) { setRoomImages(p=>[...p,{url:inp.value}]); inp.value='' }
                      }}><i className="fas fa-plus" /></button>
                    </div>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                      {roomImages.map((img,i) => (
                        <div key={i} style={{ position:'relative' }}>
                          <img src={img.url} alt="" className="im" />
                          <button type="button" style={{ position:'absolute',top:0,right:0,width:18,height:18,background:'var(--err)',color:'#fff',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:'0.55rem',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setRoomImages(p=>p.filter((_,j)=>j!==i))}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="bp" style={{ background:'#f1f5f9',color:'#475569' }} onClick={()=>setModal(null)}>ยกเลิก</button>
                <button type="submit" className="bp"><i className="fas fa-save me-1" />บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking modal */}
      {modal==='booking' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box modal-xl" onClick={e=>e.stopPropagation()} style={{ maxHeight:'90vh' }}>
            <div className="modal-hd">
              <h5><i className={`fas fa-${modalData.editing?'edit':'calendar-plus'} me-2`} />{modalData.editing ? `แก้ไขการจอง` : 'สร้างการจอง'}</h5>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <form onSubmit={saveBooking}>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-4"><label className="form-label">ชื่อลูกค้า *</label><input type="text" name="customerName" className="form-control" required defaultValue={modalData.customerName as string||''} /></div>
                  <div className="col-3"><label className="form-label">เบอร์โทร *</label><input type="tel" name="customerPhone" className="form-control" required defaultValue={modalData.customerPhone as string||''} /></div>
                  <div className="col-3"><label className="form-label">ช่องทาง</label>
                    <select name="source" className="form-select" defaultValue={modalData.source as string||'walkin'}>
                      <option value="facebook">Facebook</option><option value="line">Line</option><option value="walkin">Walk-in</option><option value="online">Online</option><option value="other">อื่นๆ</option>
                    </select>
                  </div>
                  <div className="col-2"><label className="form-label">ผู้เข้าพัก</label><input type="number" name="guests" className="form-control" min={1} defaultValue={modalData.guests as number||2} /></div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-4"><label className="form-label">เช็คอิน *</label><input type="date" className="form-control" value={bkCI} onChange={e=>{setBkCI(e.target.value);setBookingTabs(p=>p.map(t=>({...t,calc:null})));}} required /></div>
                  <div className="col-4"><label className="form-label">เช็คเอาท์ *</label><input type="date" className="form-control" value={bkCO} min={bkCI} onChange={e=>{setBkCO(e.target.value);setBookingTabs(p=>p.map(t=>({...t,calc:null})));}} required /></div>
                  <div className="col-4"><label className="form-label">มัดจำ (฿)</label><input type="number" className="form-control" value={bkDep} min={0} onChange={e=>setBkDep(Number(e.target.value))} /></div>
                </div>
                <div className="form-group mb-3"><label className="form-label">หมายเหตุ</label><textarea name="notes" className="form-control" rows={2} defaultValue={modalData.notes as string||''} /></div>

                {/* Room tabs */}
                <div style={{ display:'flex',alignItems:'flex-end',flexWrap:'wrap',gap:4,marginBottom:0 }}>
                  {bookingTabs.map((tab,i) => {
                    const r = rooms.find(x=>x.id===Number(tab.roomId))
                    return (
                      <div key={i} className={`rt ${i===activeTab?'on':''}`} onClick={()=>setActiveTab(i)}>
                        <i className="fas fa-bed" /> {r?.name||`ห้อง ${i+1}`}
                        {bookingTabs.length>1 && <span style={{ marginLeft:4,background:'var(--err)',color:'#fff',borderRadius:'50%',width:16,height:16,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',cursor:'pointer' }} onClick={e=>{e.stopPropagation();setBookingTabs(p=>p.filter((_,j)=>j!==i));if(activeTab>=bookingTabs.length-1)setActiveTab(0)}}>✕</span>}
                      </div>
                    )
                  })}
                  <button type="button" className="bp" style={{ padding:'4px 10px',fontSize:'0.8rem',marginBottom:2 }} onClick={()=>{setBookingTabs(p=>[...p,{roomId:'',ea:0,ec:0,dc:0,calc:null}]);setActiveTab(bookingTabs.length)}}>+ห้อง</button>
                </div>
                <div className="rp on" style={{ marginBottom:12 }}>
                  <div className="row g-3">
                    <div className="col-5">
                      <label className="form-label">ห้อง *</label>
                      <select className="form-select" value={bookingTabs[activeTab]?.roomId||''} onChange={e=>{setBookingTabs(p=>{const n=[...p];n[activeTab]={...n[activeTab],roomId:e.target.value,calc:null};return n});if(e.target.value&&bkCI&&bkCO)setTimeout(()=>calcPrice({...bookingTabs[activeTab],roomId:e.target.value},bkCI,bkCO,activeTab),100)}}>
                        <option value="">-- เลือกห้อง --</option>
                        {rooms.map(r=><option key={r.id} value={r.id} disabled={bookingTabs.some((t,i)=>i!==activeTab&&t.roomId===String(r.id))}>{r.name} (฿{r.price_per_night.toLocaleString()})</option>)}
                      </select>
                    </div>
                    <div className="col-2"><label className="form-label">เตียงผู้ใหญ่</label><input type="number" className="form-control" value={bookingTabs[activeTab]?.ea||0} min={0} onChange={e=>{setBookingTabs(p=>{const n=[...p];n[activeTab]={...n[activeTab],ea:Number(e.target.value),calc:null};return n});if(bookingTabs[activeTab]?.roomId&&bkCI&&bkCO)setTimeout(()=>calcPrice({...bookingTabs[activeTab],ea:Number(e.target.value)},bkCI,bkCO,activeTab),100)}} /></div>
                    <div className="col-2"><label className="form-label">เตียงเด็ก</label><input type="number" className="form-control" value={bookingTabs[activeTab]?.ec||0} min={0} onChange={e=>{setBookingTabs(p=>{const n=[...p];n[activeTab]={...n[activeTab],ec:Number(e.target.value),calc:null};return n})}} /></div>
                    <div className="col-3"><label className="form-label">ส่วนลด (฿)</label><input type="number" className="form-control" value={bookingTabs[activeTab]?.dc||0} min={0} onChange={e=>setBookingTabs(p=>{const n=[...p];n[activeTab]={...n[activeTab],dc:Number(e.target.value)};return n})} /></div>
                  </div>
                  {bookingTabs[activeTab]?.roomId && bkCI && bkCO && (
                    <div style={{ marginTop:10 }}>
                      {!bookingTabs[activeTab]?.calc ? (
                        <button type="button" className="bp" style={{ background:'var(--p5)',color:'var(--p2)',fontSize:'0.82rem' }} onClick={()=>calcPrice(bookingTabs[activeTab],bkCI,bkCO,activeTab)}><i className="fas fa-calculator me-1" />คำนวณราคา</button>
                      ) : (
                        <div className="table-responsive">
                          <table className="bt table table-sm table-bordered"><thead><tr><th>วันที่</th><th>ประเภท</th><th>ห้อง</th><th>เตียงเสริม</th><th>รวม</th></tr></thead>
                          <tbody>
                            {bookingTabs[activeTab].calc!.bd.map((b,i) => (
                              <tr key={i}><td>{b.date}</td><td style={{ color:b.label==='ปกติ'?'inherit':'var(--err)',fontWeight:b.label==='ปกติ'?400:600 }}>{b.label}</td>
                              <td><input type="number" className="bt" style={{ width:80 }} value={bookingTabs[activeTab].calc!.np[i]||0} onChange={e=>setBookingTabs(p=>{const n=[...p];n[activeTab].calc!.np[i]=Number(e.target.value);n[activeTab].calc!.rT=n[activeTab].calc!.np.reduce((s,v)=>s+v,0);return n})} /></td>
                              <td><input type="number" className="bt" style={{ width:80 }} value={bookingTabs[activeTab].calc!.ne[i]||0} onChange={e=>setBookingTabs(p=>{const n=[...p];n[activeTab].calc!.ne[i]=Number(e.target.value);n[activeTab].calc!.bT=n[activeTab].calc!.ne.reduce((s,v)=>s+v,0);return n})} /></td>
                              <td>{fmt((bookingTabs[activeTab].calc!.np[i]||0)+(bookingTabs[activeTab].calc!.ne[i]||0))}</td></tr>
                            ))}
                          </tbody></table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Grand total */}
                <div className="gt">
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',textAlign:'center',gap:4 }}>
                    {bookingTabs.map((t,i) => {
                      const rT=t.calc?t.calc.np.reduce((s,v)=>s+v,0):0
                      const bT=t.calc?t.calc.ne.reduce((s,v)=>s+v,0):0
                      return <div key={i}><div style={{ opacity:0.75,fontSize:'0.78rem' }}>ห้อง {i+1}</div><div style={{ fontWeight:700 }}>{fmt(rT+bT-(t.dc||0))}</div></div>
                    })}
                  </div>
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)',marginTop:10,paddingTop:10,display:'grid',gridTemplateColumns:'repeat(3,1fr)',textAlign:'center' }}>
                    <div><div style={{ opacity:0.75,fontSize:'0.78rem' }}>รวมทั้งสิ้น</div><div style={{ fontWeight:700,fontSize:'1.2rem' }}>{fmt(bookingTabs.reduce((s,t)=>{const rT=t.calc?t.calc.np.reduce((a,v)=>a+v,0):0;const bT=t.calc?t.calc.ne.reduce((a,v)=>a+v,0):0;return s+rT+bT-(t.dc||0)},0))}</div></div>
                    <div><div style={{ opacity:0.75,fontSize:'0.78rem' }}>มัดจำ</div><div style={{ fontWeight:700 }}>{fmt(bkDep)}</div></div>
                    <div><div style={{ opacity:0.75,fontSize:'0.78rem' }}>คงเหลือ</div><div style={{ fontWeight:700,color:'#fcd34d' }}>{fmt(bookingTabs.reduce((s,t)=>{const rT=t.calc?t.calc.np.reduce((a,v)=>a+v,0):0;const bT=t.calc?t.calc.ne.reduce((a,v)=>a+v,0):0;return s+rT+bT-(t.dc||0)},0)-bkDep)}</div></div>
                  </div>
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="bp" style={{ background:'#f1f5f9',color:'#475569' }} onClick={()=>setModal(null)}>ยกเลิก</button>
                <button type="submit" className="bp"><i className="fas fa-save me-1" />บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction modal */}
      {modal==='tx' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><h5><i className="fas fa-plus-circle me-2" />เพิ่มรายการ</h5><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <form onSubmit={saveTx}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">วันที่</label><input type="date" name="date" className="form-control" defaultValue={today} required /></div>
                <div className="form-group"><label className="form-label">ประเภท</label>
                  <select name="type" className="form-select"><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select>
                </div>
                <div className="form-group"><label className="form-label">หมวด</label>
                  <select name="category" className="form-select">
                    {categories.map(c=><option key={c.id}>{c.name}</option>)}
                    {categories.length===0 && <option>-</option>}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">จำนวน (฿)</label><input type="number" name="amount" className="form-control" min={0} required /></div>
                <div className="form-group"><label className="form-label">รายละเอียด</label><input type="text" name="description" className="form-control" /></div>
              </div>
              <div className="modal-ft">
                <button type="button" className="bp" style={{ background:'#f1f5f9',color:'#475569' }} onClick={()=>setModal(null)}>ยกเลิก</button>
                <button type="submit" className="bp"><i className="fas fa-save me-1" />บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category modal */}
      {modal==='cat' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><h5><i className="fas fa-tag me-2" />เพิ่มหมวดหมู่</h5><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <form onSubmit={saveCat}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">ชื่อ *</label><input type="text" name="name" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">ประเภท</label><select name="type" className="form-select"><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select></div>
                <div className="form-group"><label className="form-label">สี</label><input type="color" name="color" className="form-control" defaultValue="#2563eb" style={{ height:40 }} /></div>
              </div>
              <div className="modal-ft">
                <button type="button" className="bp" style={{ background:'#f1f5f9',color:'#475569' }} onClick={()=>setModal(null)}>ยกเลิก</button>
                <button type="submit" className="bp"><i className="fas fa-save me-1" />บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User modal */}
      {modal==='user' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><h5><i className="fas fa-user-plus me-2" />{modalData.user ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}</h5><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <form onSubmit={saveUser}>
              <div className="modal-body">
                <input type="hidden" name="id" value={(modalData.user as User)?.id||''} />
                <div className="form-group"><label className="form-label">Username</label><input type="text" name="username" className="form-control" required defaultValue={(modalData.user as User)?.username||''} /></div>
                <div className="form-group"><label className="form-label">Password {modalData.user ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '*'}</label><input type="password" name="password" className="form-control" {...(!modalData.user ? {required:true} : {})} /></div>
                <div className="form-group"><label className="form-label">ชื่อ</label><input type="text" name="display_name" className="form-control" defaultValue={(modalData.user as User)?.display_name||''} /></div>
                <div className="form-group"><label className="form-label">บทบาท</label>
                  <select name="role" className="form-select" defaultValue={(modalData.user as User)?.role||'staff'}>
                    <option value="owner">เจ้าของ</option><option value="admin">แอดมิน</option><option value="staff">พนักงาน</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">สิทธิ์</label><input type="text" name="permissions" className="form-control" defaultValue={(modalData.user as User)?.permissions||'all'} /></div>
              </div>
              <div className="modal-ft">
                <button type="button" className="bp" style={{ background:'#f1f5f9',color:'#475569' }} onClick={()=>setModal(null)}>ยกเลิก</button>
                <button type="submit" className="bp"><i className="fas fa-save me-1" />บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {modal==='pay' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><h5><i className="fas fa-money-bill-wave me-2" />ชำระเงิน</h5><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <div className="modal-body">
              <div style={{ textAlign:'center',marginBottom:16 }}>
                <div style={{ fontSize:'0.85rem',color:'var(--sb)' }}>ยอดรวม</div>
                <div style={{ fontWeight:700,fontSize:'1.6rem',color:'var(--p2)' }}>{fmt(modalData.total)}</div>
                <div style={{ fontSize:'0.85rem',color:'var(--sb)' }}>ชำระแล้ว: {fmt(modalData.paid)}</div>
                <div style={{ fontWeight:700,color:'var(--err)' }}>คงเหลือ: {fmt(modalData.remaining)}</div>
              </div>
              <div style={{ display:'grid',gap:8 }}>
                <button className="bp" style={{ background:'var(--warn)',justifyContent:'center',padding:10 }} onClick={()=>applyPayment(50)}><i className="fas fa-percentage me-2" />ชำระ 50%</button>
                <button className="bp" style={{ background:'var(--ok)',justifyContent:'center',padding:10 }} onClick={()=>applyPayment(100)}><i className="fas fa-check-circle me-2" />เต็มจำนวน</button>
                <button className="bp" style={{ background:'var(--p5)',color:'var(--p2)',justifyContent:'center',padding:10 }} onClick={()=>applyPayment('custom')}><i className="fas fa-edit me-2" />ระบุจำนวน</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Doughnut Chart Component ────────────────────────────────
function DoughnutChart({ data, cats }: { data: Transaction[]; cats: Category[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)

  const grouped: Record<string,number> = {}
  data.forEach(t => { grouped[t.category] = (grouped[t.category]||0) + t.amount })
  const labels = Object.keys(grouped)
  const values = labels.map(k => grouped[k])
  const colors = labels.map(k => cats.find(c=>c.name===k)?.color || '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'))

  useEffect(() => {
    if (!canvasRef.current || labels.length === 0) return
    import('chart.js').then(({ Chart, ArcElement, DoughnutController, Legend, Tooltip }) => {
      Chart.register(ArcElement, DoughnutController, Legend, Tooltip)
      if (chartRef.current) (chartRef.current as {destroy:()=>void}).destroy()
      chartRef.current = new Chart(canvasRef.current!, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 1, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
      })
    })
    return () => { if (chartRef.current) (chartRef.current as {destroy:()=>void}).destroy() }
  }, [data, cats]) // eslint-disable-line

  if (labels.length === 0) return <div style={{ textAlign:'center',padding:24,color:'var(--sb)',fontSize:'0.85rem' }}>ไม่มีข้อมูล</div>

  return (
    <div>
      <div style={{ height:180, position:'relative' }}><canvas ref={canvasRef} /></div>
      <div style={{ marginTop:8, fontSize:'0.78rem' }}>
        {labels.map((l,i) => (
          <span key={l} style={{ display:'inline-flex',alignItems:'center',gap:4,margin:'2px 8px 2px 0' }}>
            <span style={{ width:10,height:10,borderRadius:'50%',background:colors[i],display:'inline-block' }} />
            {l} <strong>฿{NF(values[i])}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}
