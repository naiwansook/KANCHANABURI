'use client'
import { useState, useEffect } from 'react'

interface Room {
  id: number; name: string; bathroom_type: string;
  price_per_night: number; max_guests: number; description: string;
  images: { url: string }[]; amenities: string; extra_bed_price: number;
  available?: boolean; reason?: string; calculated_total?: number;
}

export default function BookingClient() {
  const [step, setStep] = useState(1)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [nights, setNights] = useState(0)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', line: '', guests: '2', notes: '', deposit: '0', extraBeds: '0' })
  const [result, setResult] = useState<{ id: number; total_price: number; deposit_amount: number; remaining_balance: number; room_name: string; nights: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setCheckIn(today)
  }, [])

  useEffect(() => {
    if (checkIn && checkOut) {
      const n = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      setNights(n > 0 ? n : 0)
    }
  }, [checkIn, checkOut])

  async function goStep2() {
    if (!checkIn || !checkOut || nights <= 0) { alert('กรุณาเลือกวันที่ให้ถูกต้อง'); return }
    setLoading(true); setStep(2)
    const res = await fetch(`/api/availablerooms?check_in=${checkIn}&check_out=${checkOut}`)
    const data = await res.json()
    setRooms(data); setLoading(false)
  }

  function goStep3() {
    if (!selectedRoom) { alert('กรุณาเลือกห้อง'); return }
    setStep(3)
  }

  async function submitBooking() {
    if (!form.name || !form.phone) { alert('กรุณากรอกชื่อและเบอร์โทร'); return }
    setSubmitting(true)
    const extraBeds = parseInt(form.extraBeds) || 0
    const deposit = parseInt(form.deposit) || 0
    const totalPrice = (selectedRoom!.price_per_night + (selectedRoom!.extra_bed_price || 0) * extraBeds) * nights
    const res = await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking: {
          customer_name: form.name, customer_phone: form.phone,
          customer_email: form.email, customer_line: form.line,
          room_id: selectedRoom!.id, check_in: checkIn, check_out: checkOut,
          guests: parseInt(form.guests) || 2, notes: form.notes,
          deposit_amount: deposit, extra_beds: extraBeds,
          total_price: totalPrice, booking_source: 'online',
        }, isPublic: true,
      }),
    })
    const data = await res.json()
    if (data.success) { setResult(data); setStep(4) }
    else alert(data.error || 'เกิดข้อผิดพลาด')
    setSubmitting(false)
  }

  const bathroomLabel: Record<string, string> = { private: 'ห้องน้ำในตัว', separate: 'ห้องน้ำแยก', shared: 'ห้องน้ำรวม' }
  const totalPrice = selectedRoom ? selectedRoom.price_per_night * nights : 0
  const deposit = parseInt(form.deposit) || 0

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif", background: '#f5f6fa', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff', padding: '36px 0 50px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 6 }}><i className="fas fa-hotel me-2" />จองห้องพักออนไลน์</h2>
        <p style={{ opacity: 0.85, marginBottom: 20, fontSize: '0.9rem' }}>เลือกวันที่ → เลือกห้อง → กรอกข้อมูล → ยืนยัน</p>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s',
                background: step > s ? '#10b981' : step === s ? '#fff' : 'rgba(255,255,255,0.25)',
                color: step > s ? '#fff' : step === s ? '#1e3a5f' : 'rgba(255,255,255,0.7)',
                boxShadow: step === s ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
              }}>
                {step > s ? <i className="fas fa-check" style={{ fontSize: '0.75rem' }} /> : s}
              </div>
              {s < 4 && <div style={{ width: 32, height: 2, background: step > s ? '#10b981' : 'rgba(255,255,255,0.25)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 48px' }}>
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.09)', padding: '28px', marginTop: -28, position: 'relative', zIndex: 10 }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h4 style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 24 }}><i className="fas fa-calendar-alt me-2" style={{ color: '#2563eb' }} />เลือกวันเข้าพัก</h4>
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <label className="form-label">วันเช็คอิน *</label>
                  <input type="date" className="form-control" value={checkIn} min={new Date().toISOString().split('T')[0]} onChange={e => setCheckIn(e.target.value)} />
                </div>
                <div className="col-6">
                  <label className="form-label">วันเช็คเอาท์ *</label>
                  <input type="date" className="form-control" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} />
                </div>
              </div>
              {nights > 0 && <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ background: '#dbeafe', color: '#1e3a5f', padding: '6px 20px', borderRadius: 100, fontWeight: 700 }}>{nights} คืน</span>
              </div>}
              <div style={{ textAlign: 'right' }}>
                <button className="bp" onClick={goStep2} disabled={nights <= 0} style={{ padding: '10px 28px' }}>
                  ดูห้องว่าง <i className="fas fa-arrow-right ms-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h4 style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}><i className="fas fa-bed me-2" style={{ color: '#2563eb' }} />เลือกห้องพัก</h4>
              <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.87rem' }}>
                {checkIn} — {checkOut} ({nights} คืน)
              </p>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                  <div className="spinner" style={{ borderColor: '#dbeafe', borderTopColor: '#2563eb', width: 36, height: 36, margin: '0 auto 12px' }} />
                  กำลังตรวจสอบห้องว่าง...
                </div>
              ) : (
                <div className="row g-3 mb-4">
                  {rooms.map(room => (
                    <div key={room.id} className="col-6" style={{ minWidth: 280 }}>
                      <div onClick={() => room.available && setSelectedRoom(room)}
                        style={{
                          border: `2px solid ${selectedRoom?.id === room.id ? '#2563eb' : room.available ? '#e2e8f0' : '#e2e8f0'}`,
                          borderRadius: 12, padding: 16, cursor: room.available ? 'pointer' : 'not-allowed',
                          opacity: room.available ? 1 : 0.6, position: 'relative',
                          background: selectedRoom?.id === room.id ? '#eff6ff' : '#fff',
                          transition: 'all 0.15s',
                        }}>
                        <span style={{
                          position: 'absolute', top: 10, right: 10,
                          background: room.available ? '#10b981' : '#ef4444',
                          color: '#fff', padding: '2px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600,
                        }}>{room.available ? 'ว่าง' : 'ไม่ว่าง'}</span>
                        {room.images?.[0] ? (
                          <img src={room.images[0].url} alt={room.name} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
                        ) : (
                          <div style={{ height: 80, background: '#f0f4f8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                            <i className="fas fa-image fa-2x" style={{ color: '#94a3b8' }} />
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>{bathroomLabel[room.bathroom_type] || room.bathroom_type}</div>
                        <h6 style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>{room.name}</h6>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>{room.description}</div>
                        {room.amenities && <div style={{ marginBottom: 8 }}>
                          {room.amenities.split(',').map((a, i) => (
                            <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: '0.68rem', marginRight: 4 }}>{a.trim()}</span>
                          ))}
                        </div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>฿{room.price_per_night.toLocaleString()}/คืน × {nights}</div>
                            <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '1.1rem' }}>฿{(room.price_per_night * nights).toLocaleString()}</div>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}><i className="fas fa-user me-1" />{room.max_guests}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="bp" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setStep(1)}><i className="fas fa-arrow-left me-1" />เปลี่ยนวัน</button>
                <button className="bp" onClick={goStep3} disabled={!selectedRoom} style={{ padding: '10px 28px' }}>ถัดไป <i className="fas fa-arrow-right ms-1" /></button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && selectedRoom && (
            <div>
              <h4 style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 20 }}><i className="fas fa-user me-2" style={{ color: '#2563eb' }} />กรอกข้อมูลการจอง</h4>
              <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', borderRadius: 12, padding: 16, color: '#fff', marginBottom: 20 }}>
                <div className="row" style={{ textAlign: 'center', margin: 0 }}>
                  {[['ห้อง', selectedRoom.name], ['จำนวนคืน', `${nights} คืน`], ['ราคารวม', `฿${totalPrice.toLocaleString()}`]].map(([l, v]) => (
                    <div key={l} className="col"><div style={{ opacity: 0.75, fontSize: '0.78rem' }}>{l}</div><div style={{ fontWeight: 700, fontSize: '1rem' }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div className="row g-3">
                {[['name','ชื่อ-นามสกุล *','text'],['phone','เบอร์โทรศัพท์ *','tel'],['email','Email','email'],['line','LINE ID','text']].map(([k,l,t]) => (
                  <div key={k} className="col-6">
                    <label className="form-label">{l}</label>
                    <input type={t} className="form-control" value={form[k as keyof typeof form]} onChange={e => setForm(p => ({...p, [k]: e.target.value}))} />
                  </div>
                ))}
                <div className="col-6">
                  <label className="form-label">จำนวนผู้เข้าพัก</label>
                  <input type="number" className="form-control" value={form.guests} min={1} onChange={e => setForm(p => ({...p, guests: e.target.value}))} />
                </div>
                {selectedRoom.extra_bed_price > 0 && (
                  <div className="col-6">
                    <label className="form-label">เตียงเสริม (฿{selectedRoom.extra_bed_price.toLocaleString()}/คืน)</label>
                    <input type="number" className="form-control" value={form.extraBeds} min={0} onChange={e => setForm(p => ({...p, extraBeds: e.target.value}))} />
                  </div>
                )}
                <div className="col-12">
                  <label className="form-label">หมายเหตุ</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
                </div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: 14, marginTop: 14 }}>
                <h6 style={{ fontWeight: 700, color: '#92400e', marginBottom: 8 }}><i className="fas fa-hand-holding-usd me-2" />เงินมัดจำ (ถ้ามี)</h6>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small">จำนวนเงินมัดจำ (฿)</label>
                    <input type="number" className="form-control" value={form.deposit} min={0} onChange={e => setForm(p => ({...p, deposit: e.target.value}))} />
                  </div>
                  <div className="col-6" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                    {deposit > 0 ? <small style={{ color: '#065f46' }}>คงเหลือ: <strong>฿{(totalPrice - deposit).toLocaleString()}</strong></small>
                      : <small style={{ color: '#64748b' }}>ชำระเต็มจำนวนวันเช็คอิน</small>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button className="bp" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setStep(2)}><i className="fas fa-arrow-left me-1" />เลือกห้องใหม่</button>
                <button className="bp" style={{ background: '#10b981', padding: '10px 28px' }} onClick={submitBooking} disabled={submitting}>
                  {submitting ? <><span className="spinner" style={{ width: 14, height: 14 }} /> กำลังจอง...</> : <><i className="fas fa-check-circle me-1" />ยืนยันการจอง</>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && result && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: 16 }}>✓</div>
              <h3 style={{ color: '#10b981', fontWeight: 700 }}>จองสำเร็จ!</h3>
              <p style={{ color: '#64748b', marginBottom: 4 }}>หมายเลขการจอง</p>
              <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 20 }}>#{result.id}</h2>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'left' }}>
                {[
                  ['ห้อง', result.room_name], ['เช็คอิน', checkIn], ['เช็คเอาท์', checkOut],
                  ['จำนวนคืน', `${result.nights} คืน`],
                  ['ราคารวม', `฿${result.total_price.toLocaleString()}`],
                  ['มัดจำ', `฿${result.deposit_amount.toLocaleString()}`],
                  ['คงเหลือ', `฿${result.remaining_balance.toLocaleString()}`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '0.87rem' }}>{l}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.87rem' }}>{v}</span>
                  </div>
                ))}
              </div>
              {result.remaining_balance > 0 && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: '0.85rem', color: '#991b1b' }}>
                  <i className="fas fa-exclamation-triangle me-2" />
                  กรุณาชำระเงินส่วนที่เหลือ <strong>฿{result.remaining_balance.toLocaleString()}</strong> ในวันเช็คอิน
                </div>
              )}
              <button className="bp" style={{ marginRight: 8 }} onClick={() => window.print()}><i className="fas fa-print me-1" />พิมพ์ใบจอง</button>
              <button className="bp" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => { setStep(1); setSelectedRoom(null); setResult(null); setForm({ name:'',phone:'',email:'',line:'',guests:'2',notes:'',deposit:'0',extraBeds:'0' }) }}>
                <i className="fas fa-redo me-1" />จองใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
