import { supabase } from '../../lib/supabase'

// Thai holidays helper
function getThaiHolidays(year) {
  const h = {}
  const add = (m, d, name) => {
    h[`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`] = name
  }
  add(1,1,'วันขึ้นปีใหม่');add(4,6,'วันจักรี');add(4,13,'วันสงกรานต์');add(4,14,'วันสงกรานต์');add(4,15,'วันสงกรานต์')
  add(5,1,'วันแรงงาน');add(5,4,'วันฉัตรมงคล');add(6,3,'วันเฉลิมฯ พระราชินี');add(7,28,'วันเฉลิมฯ ร.10')
  add(8,12,'วันแม่แห่งชาติ');add(10,13,'วันนวมินทรมหาราช');add(10,23,'วันปิยมหาราช')
  add(12,5,'วันพ่อแห่งชาติ');add(12,10,'วันรัฐธรรมนูญ');add(12,31,'วันสิ้นปี')
  const lunar = {
    2024:{makha:'2024-02-24',visakha:'2024-05-22',asanha:'2024-07-20',khao:'2024-07-21',ok:'2024-10-17'},
    2025:{makha:'2025-02-12',visakha:'2025-05-11',asanha:'2025-07-10',khao:'2025-07-11',ok:'2025-10-07'},
    2026:{makha:'2026-03-03',visakha:'2026-05-31',asanha:'2026-07-29',khao:'2026-07-30',ok:'2026-10-25'},
    2027:{makha:'2027-02-20',visakha:'2027-05-20',asanha:'2027-07-18',khao:'2027-07-19',ok:'2027-10-14'},
    2028:{makha:'2028-02-09',visakha:'2028-05-08',asanha:'2028-07-06',khao:'2028-07-07',ok:'2028-10-02'}
  }
  const lh = lunar[year]
  if (lh) {
    h[lh.makha]='วันมาฆบูชา';h[lh.visakha]='วันวิสาขบูชา';h[lh.asanha]='วันอาสาฬหบูชา'
    h[lh.khao]='วันเข้าพรรษา';h[lh.ok]='วันออกพรรษา'
  }
  return h
}

function calcRoomPrice(room, checkIn, checkOut) {
  const ci = new Date(checkIn), co = new Date(checkOut)
  const nights = Math.ceil((co - ci) / 86400000)
  let total = 0, breakdown = []
  const holidayCache = {}
  for (let i = 0; i < nights; i++) {
    const d = new Date(ci.getTime() + i * 86400000)
    const ds = d.toISOString().split('T')[0]
    const dow = d.getDay(), y = d.getFullYear()
    if (!holidayCache[y]) holidayCache[y] = getThaiHolidays(y)
    const holidays = holidayCache[y]
    let price = room.pricePerNight || 0, label = 'ปกติ'
    if (holidays[ds] && room.holidayPrice) { price = room.holidayPrice; label = 'วันหยุด (' + holidays[ds] + ')' }
    else if (dow === 0 && room.weekendPriceSun) { price = room.weekendPriceSun; label = 'วันอาทิตย์' }
    else if (dow === 6 && room.weekendPriceSat) { price = room.weekendPriceSat; label = 'วันเสาร์' }
    else if (dow === 5 && room.weekendPriceFri) { price = room.weekendPriceFri; label = 'วันศุกร์' }
    total += price
    breakdown.push({ date: ds, price, label, dow })
  }
  return { total, nights, breakdown }
}

function calcExtraBedTotal(breakdown, ebAdult, ebChild, ebAdultP, ebChildP, ebAdultHolP, ebChildHolP) {
  let total = 0
  ;(breakdown || []).forEach(b => {
    const isHol = b.label && b.label !== 'ปกติ'
    const aP = isHol && ebAdultHolP ? ebAdultHolP : (ebAdultP || 0)
    const cP = isHol && ebChildHolP ? ebChildHolP : (ebChildP || 0)
    total += (ebAdult || 0) * aP + (ebChild || 0) * cP
  })
  return total
}

// ---- HANDLERS ----

async function checkLogin(username, password) {
  const { data } = await supabase.from('UserLogin').select('*').eq('Username', username).eq('Password', password).single()
  if (!data) return { success: false }
  return { success: true, username: data.Username, role: data.Role || 'staff', displayName: data.DisplayName || data.Username, permissions: data.Permissions || '' }
}

async function getAllRooms() {
  const { data } = await supabase.from('Rooms').select('*').order('ID')
  return (data || []).map(r => ({
    id: r.ID, name: r.Name, bathroomType: r.BathroomType || 'private',
    pricePerNight: Number(r.PricePerNight), maxGuests: Number(r.MaxGuests),
    description: r.Description, status: r.Status || 'available',
    images: (() => { try { return r.ImageURLs ? JSON.parse(r.ImageURLs) : [] } catch { return r.ImageURLs ? [{ url: r.ImageURLs }] : [] } })(),
    amenities: r.Amenities || '', extraBedPrice: Number(r.ExtraBedPrice) || 0,
    roomLabel: r.RoomLabel || '', weekendPriceFri: Number(r.WeekendPriceFri) || 0,
    weekendPriceSat: Number(r.WeekendPriceSat) || 0, weekendPriceSun: Number(r.WeekendPriceSun) || 0,
    holidayPrice: Number(r.HolidayPrice) || 0, extraBedAdultPrice: Number(r.ExtraBedAdultPrice) || 0,
    extraBedChildPrice: Number(r.ExtraBedChildPrice) || 0,
    extraBedAdultHolidayPrice: Number(r.ExtraBedAdultHolidayPrice) || 0,
    extraBedChildHolidayPrice: Number(r.ExtraBedChildHolidayPrice) || 0
  }))
}

async function saveRoom(room) {
  try {
    const imgsJson = JSON.stringify(room.images || [])
    const row = {
      Name: room.name, BathroomType: room.bathroomType || 'private',
      PricePerNight: room.pricePerNight, MaxGuests: room.maxGuests,
      Description: room.description, Status: room.status || 'available',
      ImageURLs: imgsJson, Amenities: room.amenities || '',
      ExtraBedPrice: room.extraBedAdultPrice || 0, RoomLabel: room.roomLabel || '',
      WeekendPriceFri: room.weekendPriceFri || 0, WeekendPriceSat: room.weekendPriceSat || 0,
      WeekendPriceSun: room.weekendPriceSun || 0, HolidayPrice: room.holidayPrice || 0,
      ExtraBedAdultPrice: room.extraBedAdultPrice || 0, ExtraBedChildPrice: room.extraBedChildPrice || 0,
      ExtraBedAdultHolidayPrice: room.extraBedAdultHolidayPrice || 0,
      ExtraBedChildHolidayPrice: room.extraBedChildHolidayPrice || 0
    }
    if (room.id) {
      await supabase.from('Rooms').update(row).eq('ID', room.id)
      return { success: true, id: room.id }
    } else {
      const { data: maxRow } = await supabase.from('Rooms').select('ID').order('ID', { ascending: false }).limit(1)
      const nextId = maxRow && maxRow.length ? maxRow[0].ID + 1 : 1
      await supabase.from('Rooms').insert({ ID: nextId, ...row })
      return { success: true, id: nextId }
    }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function deleteRoom(id) {
  try { await supabase.from('Rooms').delete().eq('ID', id); return { success: true } }
  catch (e) { return { success: false, error: e.toString() } }
}

async function getAllBookings() {
  const { data } = await supabase.from('Bookings').select('*').order('ID')
  return (data || []).map(r => ({
    id: r.ID, customerName: r.CustomerName, customerPhone: r.CustomerPhone,
    customerEmail: r.CustomerEmail, customerLine: r.CustomerLine,
    roomId: r.RoomID, roomName: r.RoomName,
    checkIn: r.CheckIn ? r.CheckIn.split('T')[0] : '',
    checkOut: r.CheckOut ? r.CheckOut.split('T')[0] : '',
    guests: Number(r.Guests), nights: Number(r.Nights), totalPrice: Number(r.TotalPrice),
    status: r.Status, paymentStatus: r.PaymentStatus, notes: r.Notes,
    createdAt: r.CreatedAt, createdBy: r.CreatedBy || '',
    depositAmount: Number(r.DepositAmount) || 0, depositPaid: !!r.DepositPaid,
    remainingBalance: Number(r.RemainingBalance) || 0,
    extraBeds: Number(r.ExtraBeds) || 0, extraBedTotal: Number(r.ExtraBedTotal) || 0,
    extraBedsAdult: Number(r.ExtraBedsAdult) || 0, extraBedsChild: Number(r.ExtraBedsChild) || 0
  }))
}

async function createBooking(booking, username) {
  try {
    const rooms = await getAllRooms()
    const room = rooms.find(r => r.id == booking.roomId)
    const priceInfo = calcRoomPrice(room || { pricePerNight: 0 }, booking.checkIn, booking.checkOut)
    const extraBedsAdult = Number(booking.extraBedsAdult) || Number(booking.extraBeds) || 0
    const extraBedsChild = Number(booking.extraBedsChild) || 0
    const ebAdultPrice = room ? (room.extraBedAdultPrice || room.extraBedPrice || 0) : 0
    const ebChildPrice = room ? (room.extraBedChildPrice || 0) : 0
    const ebAdultHolPrice = room ? (room.extraBedAdultHolidayPrice || 0) : 0
    const ebChildHolPrice = room ? (room.extraBedChildHolidayPrice || 0) : 0
    const extraBedTotal = calcExtraBedTotal(priceInfo.breakdown, extraBedsAdult, extraBedsChild, ebAdultPrice, ebChildPrice, ebAdultHolPrice, ebChildHolPrice)
    const totalBeds = extraBedsAdult + extraBedsChild
    const total = booking.totalPrice ? Number(booking.totalPrice) : (priceInfo.total + extraBedTotal)
    const deposit = Number(booking.depositAmount) || 0
    const remaining = total - deposit
    const { data: maxRow } = await supabase.from('Bookings').select('ID').order('ID', { ascending: false }).limit(1)
    const nextId = maxRow && maxRow.length ? maxRow[0].ID + 1 : 1
    await supabase.from('Bookings').insert({
      ID: nextId, CustomerName: booking.customerName, CustomerPhone: booking.customerPhone || '',
      CustomerEmail: booking.customerEmail || '', CustomerLine: booking.customerLine || '',
      RoomID: booking.roomId, RoomName: room ? room.name : '',
      CheckIn: booking.checkIn, CheckOut: booking.checkOut,
      Guests: booking.guests || 1, Nights: priceInfo.nights, TotalPrice: total,
      Status: booking.status || 'pending', PaymentStatus: booking.paymentStatus || 'unpaid',
      Notes: booking.notes || '', CreatedAt: new Date().toISOString(), CreatedBy: username || 'ลูกค้า',
      DepositAmount: deposit, DepositPaid: deposit > 0, RemainingBalance: remaining,
      ExtraBeds: totalBeds, ExtraBedTotal: extraBedTotal, ExtraBedsAdult: extraBedsAdult, ExtraBedsChild: extraBedsChild
    })
    return { success: true, id: nextId, totalPrice: total, roomTotal: priceInfo.total, nights: priceInfo.nights, depositAmount: deposit, remainingBalance: remaining, roomName: room ? room.name : '', extraBeds: totalBeds, extraBedsAdult, extraBedsChild, extraBedTotal, priceBreakdown: priceInfo.breakdown }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function updateBookingStatus(bookingId, newStatus, paymentStatus) {
  try {
    const upd = {}
    if (newStatus) upd.Status = newStatus
    if (paymentStatus) { upd.PaymentStatus = paymentStatus; if (paymentStatus === 'paid') upd.RemainingBalance = 0 }
    await supabase.from('Bookings').update(upd).eq('ID', bookingId)
    return { success: true }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function updateDeposit(bookingId, depositAmount) {
  try {
    const { data } = await supabase.from('Bookings').select('TotalPrice').eq('ID', bookingId).single()
    if (!data) return { success: false }
    const total = Number(data.TotalPrice), dep = Number(depositAmount)
    const upd = { DepositAmount: dep, DepositPaid: dep > 0 ? new Date().toISOString() : null, RemainingBalance: total - dep }
    if (dep > 0) upd.PaymentStatus = 'deposit'
    if (dep >= total) upd.PaymentStatus = 'paid'
    await supabase.from('Bookings').update(upd).eq('ID', bookingId)
    return { success: true, remaining: total - dep }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function updateBookingRecord(booking) {
  try {
    const rooms = await getAllRooms()
    const room = rooms.find(r => r.id == booking.roomId)
    const priceInfo = calcRoomPrice(room || { pricePerNight: 0 }, booking.checkIn, booking.checkOut)
    const ebA = Number(booking.extraBedsAdult) || 0, ebC = Number(booking.extraBedsChild) || 0
    const eaP = room ? (room.extraBedAdultPrice || room.extraBedPrice || 0) : 0
    const ecP = room ? (room.extraBedChildPrice || 0) : 0
    const eaHolP = room ? (room.extraBedAdultHolidayPrice || 0) : 0
    const ecHolP = room ? (room.extraBedChildHolidayPrice || 0) : 0
    const ebTotal = calcExtraBedTotal(priceInfo.breakdown, ebA, ebC, eaP, ecP, eaHolP, ecHolP)
    const total = booking.totalPrice ? Number(booking.totalPrice) : (priceInfo.total + ebTotal)
    const dep = Number(booking.depositAmount) || 0
    await supabase.from('Bookings').update({
      CustomerName: booking.customerName, CustomerPhone: booking.customerPhone || '',
      RoomID: booking.roomId, RoomName: room ? room.name : '',
      CheckIn: booking.checkIn, CheckOut: booking.checkOut,
      Guests: booking.guests || 1, Nights: priceInfo.nights, TotalPrice: total,
      Notes: booking.notes || '', RemainingBalance: total - dep,
      ExtraBeds: ebA + ebC, ExtraBedTotal: ebTotal, ExtraBedsAdult: ebA, ExtraBedsChild: ebC
    }).eq('ID', booking.id)
    return { success: true }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function deleteBooking(bookingId) {
  try { await supabase.from('Bookings').delete().eq('ID', bookingId); return { success: true } }
  catch (e) { return { success: false, error: e.toString() } }
}

async function getAvailableRoomsForDates(checkIn, checkOut) {
  try {
    const rooms = await getAllRooms()
    const bookings = await getAllBookings()
    const ci = new Date(checkIn), co = new Date(checkOut)
    return rooms.map(room => {
      if (room.status !== 'available') return { ...room, available: false, reason: 'ปิดให้บริการ' }
      const conflict = bookings.some(b => {
        if (b.status === 'cancelled' || b.status === 'checked_out') return false
        if (b.roomId != room.id) return false
        return ci < new Date(b.checkOut) && co > new Date(b.checkIn)
      })
      const priceInfo = calcRoomPrice(room, checkIn, checkOut)
      return { ...room, available: !conflict, reason: conflict ? 'ไม่ว่าง' : '', calculatedTotal: priceInfo.total, priceBreakdown: priceInfo.breakdown }
    })
  } catch (e) { return [] }
}

async function calcBookingPrice(roomId, checkIn, checkOut, extraBedsAdult, extraBedsChild) {
  try {
    const rooms = await getAllRooms()
    const room = rooms.find(r => r.id == roomId)
    if (!room) return { success: false, error: 'ไม่พบห้อง' }
    const priceInfo = calcRoomPrice(room, checkIn, checkOut)
    const ebAdultP = room.extraBedAdultPrice || room.extraBedPrice || 0
    const ebChildP = room.extraBedChildPrice || 0
    const ebAdultHolP = room.extraBedAdultHolidayPrice || 0
    const ebChildHolP = room.extraBedChildHolidayPrice || 0
    const ebTotal = calcExtraBedTotal(priceInfo.breakdown, Number(extraBedsAdult) || 0, Number(extraBedsChild) || 0, ebAdultP, ebChildP, ebAdultHolP, ebChildHolP)
    return { success: true, roomTotal: priceInfo.total, extraBedTotal: ebTotal, grandTotal: priceInfo.total + ebTotal, nights: priceInfo.nights, breakdown: priceInfo.breakdown, ebAdultPrice: ebAdultP, ebChildPrice: ebChildP, ebAdultHolPrice: ebAdultHolP, ebChildHolPrice: ebChildHolP }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function submitPublicBooking(booking) {
  try {
    if (!booking.customerName || !booking.customerPhone || !booking.roomId || !booking.checkIn || !booking.checkOut)
      return { success: false, error: 'กรุณากรอกข้อมูลให้ครบ' }
    return createBooking(booking, 'ลูกค้าจองเอง')
  } catch (e) { return { success: false, error: e.toString() } }
}

async function getPublicRoomData() {
  try { const rooms = await getAllRooms(); return rooms.filter(r => r.status === 'available') }
  catch (e) { return [] }
}

async function getAllTransactions() {
  const { data } = await supabase.from('Transactions').select('*').order('ID')
  return (data || []).map((r, i) => ({
    id: r.ID || i + 2, date: r.Date ? r.Date.split('T')[0] : '',
    category: r.Category, type: r.Type, amount: Number(r.Amount),
    description: r.Description || '', createdBy: r.CreatedBy || ''
  }))
}

async function saveMultipleTransactions(transactions, username) {
  try {
    const { data: maxRow } = await supabase.from('Transactions').select('ID').order('ID', { ascending: false }).limit(1)
    let nextId = maxRow && maxRow.length ? maxRow[0].ID + 1 : 1
    const rows = transactions.map(t => ({ ID: nextId++, Date: t.date, Category: t.category, Type: t.type, Amount: t.amount, Description: t.description || '', CreatedBy: username || '' }))
    await supabase.from('Transactions').insert(rows)
    return { success: true }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function deleteTransaction(rowId) {
  try { await supabase.from('Transactions').delete().eq('ID', rowId); return { success: true } }
  catch (e) { return { success: false, error: e.toString() } }
}

async function getAllCategories() {
  const { data } = await supabase.from('Categories').select('*').order('ID')
  return (data || []).map(r => ({ id: r.ID, name: r.Name, type: r.Type, color: r.Color || '#4361ee' }))
}

async function saveCategory(category) {
  try {
    const { data: maxRow } = await supabase.from('Categories').select('ID').order('ID', { ascending: false }).limit(1)
    const nextId = maxRow && maxRow.length ? maxRow[0].ID + 1 : 1
    await supabase.from('Categories').insert({ ID: nextId, Name: category.name, Type: category.type, Color: category.color })
    return { success: true, id: nextId }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function deleteCategory(id) {
  try { await supabase.from('Categories').delete().eq('ID', id); return { success: true } }
  catch (e) { return { success: false, error: e.toString() } }
}

async function getAllBudgets() {
  const { data } = await supabase.from('Budgets').select('*')
  const budgets = {}
  ;(data || []).forEach(r => {
    const my = r.MonthYear ? String(r.MonthYear).replace("'", '') : ''
    if (!budgets[my]) budgets[my] = []
    budgets[my].push({ categoryId: r.CategoryID, name: r.Name, amount: Number(r.Amount) })
  })
  return budgets
}

async function saveBudget(monthYear, budgets) {
  try {
    await supabase.from('Budgets').delete().eq('MonthYear', monthYear)
    if (budgets.length > 0) {
      const rows = budgets.map(b => ({ MonthYear: monthYear, CategoryID: b.categoryId, Name: b.name, Amount: b.amount }))
      await supabase.from('Budgets').insert(rows)
    }
    return { success: true }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function getUserProfile() {
  const { data } = await supabase.from('User').select('*').limit(1)
  if (!data || !data.length) return { name: 'Admin', image: '' }
  return { name: data[0].Name || 'Admin', image: data[0].Image || '' }
}

async function saveUserProfile(profile) {
  try {
    const { data } = await supabase.from('User').select('*').limit(1)
    if (data && data.length) await supabase.from('User').update({ Name: profile.name, Image: profile.image }).eq('id', data[0].id)
    else await supabase.from('User').insert({ Name: profile.name, Image: profile.image })
    return { success: true }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function getAllUsers() {
  const { data } = await supabase.from('UserLogin').select('*')
  return (data || []).map((r, i) => ({ id: r.id || i + 2, username: r.Username, role: r.Role || 'staff', displayName: r.DisplayName || r.Username, permissions: r.Permissions || '' }))
}

async function saveUser(user) {
  try {
    const { data: exist } = await supabase.from('UserLogin').select('id').eq('Username', user.username).single()
    if (user.editRow) {
      const upd = { Username: user.username, Role: user.role || 'staff', DisplayName: user.displayName || user.username, Permissions: user.permissions || '' }
      if (user.password) upd.Password = user.password
      await supabase.from('UserLogin').update(upd).eq('id', user.editRow)
      return { success: true }
    }
    if (exist) return { success: false, error: 'Username ซ้ำ' }
    await supabase.from('UserLogin').insert({ Username: user.username, Password: user.password, Role: user.role || 'staff', DisplayName: user.displayName || user.username, Permissions: user.permissions || '' })
    return { success: true }
  } catch (e) { return { success: false, error: e.toString() } }
}

async function deleteUser(rowId) {
  try { await supabase.from('UserLogin').delete().eq('id', rowId); return { success: true } }
  catch (e) { return { success: false, error: e.toString() } }
}

async function getAppData() {
  try {
    const [transactions, categories, budgets, profile, rooms, bookings, users] = await Promise.all([
      getAllTransactions(), getAllCategories(), getAllBudgets(), getUserProfile(),
      getAllRooms(), getAllBookings(), getAllUsers()
    ])
    return { transactions, categories, budgets, profile, rooms, bookings, users }
  } catch (e) { return { error: e.toString() } }
}

// ---- MAIN API HANDLER ----
export default async function handler(req, res) {
  const { fn } = req.query
  const params = req.method === 'POST' ? req.body?.params || [] : []

  const allowed = [
    'checkLogin','getAppData','getAllRooms','saveRoom','deleteRoom',
    'getAllBookings','createBooking','updateBookingStatus','updateDeposit',
    'updateBookingRecord','deleteBooking','getAvailableRoomsForDates','calcBookingPrice',
    'submitPublicBooking','getPublicRoomData','getAllTransactions','saveMultipleTransactions',
    'deleteTransaction','getAllCategories','saveCategory','deleteCategory',
    'getAllBudgets','saveBudget','getUserProfile','saveUserProfile',
    'getAllUsers','saveUser','deleteUser'
  ]

  if (!allowed.includes(fn)) return res.status(403).json({ error: 'Not allowed: ' + fn })

  try {
    const fnMap = {
      checkLogin, getAppData, getAllRooms, saveRoom, deleteRoom,
      getAllBookings, createBooking, updateBookingStatus, updateDeposit,
      updateBookingRecord, deleteBooking, getAvailableRoomsForDates, calcBookingPrice,
      submitPublicBooking, getPublicRoomData, getAllTransactions, saveMultipleTransactions,
      deleteTransaction, getAllCategories, saveCategory, deleteCategory,
      getAllBudgets, saveBudget, getUserProfile, saveUserProfile,
      getAllUsers, saveUser, deleteUser
    }
    const result = await fnMap[fn](...params)
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({ error: e.toString() })
  }
}
