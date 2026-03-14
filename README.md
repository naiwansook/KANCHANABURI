# Resort Manager Pro v3.0

ระบบจัดการรีสอร์ทออนไลน์ — Next.js 14 + Supabase + Vercel

---

## 🚀 Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Custom CSS (global.css) — no Tailwind needed |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | Cookie-based session (HTTP-only) |
| Deploy | Vercel (Frontend) + Supabase (DB) |
| PDF | jsPDF + html2canvas |
| Charts | Chart.js |

---

## 📋 Features

- ✅ Dashboard (รายรับ-รายจ่าย, สถิติ, กราฟ)
- ✅ จัดการการจอง (สร้าง/แก้ไข/ยกเลิก, หลายห้องต่อกลุ่ม)
- ✅ ปฏิทินห้องพัก (แสดงว่าง/เต็ม, วันหยุดไทย)
- ✅ จัดการห้องพัก (ราคาพิเศษ ศุกร์/เสาร์/อาทิตย์/วันหยุด)
- ✅ รายรับ-รายจ่าย
- ✅ หมวดหมู่ & งบประมาณ
- ✅ PDF ใบยืนยันการจอง
- ✅ หน้าจองออนไลน์ (Public)
- ✅ จัดการผู้ใช้ (Owner/Admin/Staff)
- ✅ Responsive (Mobile-friendly)

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/resort-manager-pro.git
cd resort-manager-pro
npm install
```

### 2. Setup Supabase

1. ไปที่ [supabase.com](https://supabase.com) → New Project
2. ไปที่ **SQL Editor** → วางโค้ดจาก `supabase-schema.sql` → Run
3. ไปที่ **Settings → API** → คัดลอก URL และ Keys

### 3. Environment Variables

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXTAUTH_SECRET=any-random-string
```

### 4. Run locally

```bash
npm run dev
# เปิด http://localhost:3000
# Login: admin / admin123
```

---

## 🌐 Deploy to Vercel

### วิธีที่ 1: GitHub → Vercel (แนะนำ)

1. Push โค้ดขึ้น GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/resort-manager-pro.git
git push -u origin main
```

2. ไปที่ [vercel.com](https://vercel.com) → **Import Project** → เลือก repo
3. ใส่ Environment Variables (เหมือนใน `.env.local`)
4. Deploy!

### วิธีที่ 2: Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

---

## 🗄️ Database Schema

รัน `supabase-schema.sql` ใน Supabase SQL Editor

ตารางหลัก:
- `user_logins` — ผู้ใช้และสิทธิ์
- `rooms` — ห้องพักและราคา
- `bookings` — การจอง
- `transactions` — รายรับ-รายจ่าย
- `categories` — หมวดหมู่
- `budgets` — งบประมาณรายเดือน
- `resort_profile` — ข้อมูลรีสอร์ท
- `pdf_config` — ตั้งค่าใบจอง

---

## 🔐 Default Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | owner |

> ⚠️ **เปลี่ยน password ทันทีหลัง deploy!**
> ไปที่ Supabase SQL Editor:
> ```sql
> UPDATE user_logins SET password_hash = 'NEW_PASSWORD' WHERE username = 'admin';
> ```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/route.ts       # Login/Logout
│   │   ├── appdata/route.ts    # Load all data
│   │   ├── rooms/route.ts      # CRUD rooms
│   │   ├── bookings/route.ts   # CRUD bookings
│   │   ├── transactions/route.ts
│   │   ├── categories/route.ts
│   │   ├── budgets/route.ts
│   │   ├── users/route.ts
│   │   ├── profile/route.ts
│   │   ├── calcprice/route.ts  # Price calculation
│   │   └── availablerooms/route.ts
│   ├── booking/page.tsx        # Public booking page
│   ├── login/page.tsx
│   ├── page.tsx                # Dashboard (protected)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── DashboardClient.tsx     # Main dashboard
│   ├── BookingClient.tsx       # Public booking
│   └── LoginClient.tsx
└── lib/
    ├── supabase.ts             # Supabase clients
    ├── utils.ts                # Price calc, Thai holidays
    └── auth.ts                 # Session helpers
```

---

## 🔧 Customization

### เพิ่มราคาพิเศษ
แก้ไขใน `src/lib/utils.ts` — ฟังก์ชัน `getThaiHolidays()` และ `calcRoomPrice()`

### เพลี่ยนสีธีม
แก้ไข CSS variables ใน `src/app/globals.css`:
```css
:root {
  --p1: #1e3a5f;  /* สีหลัก */
  --p2: #2563eb;  /* สีปุ่ม */
  ...
}
```

### ลิงก์จองออนไลน์
```
https://your-domain.vercel.app/booking
```

---

## 📝 Notes

- Password ในระบบเป็น plaintext (ง่ายต่อการ migrate) — สำหรับ Production ควรใช้ bcrypt
- Session เป็น Cookie-based (7 วัน)
- PDF สร้างจาก HTML → Canvas → jsPDF ใช้งานได้กับ Vercel Edge
- รองรับรูปภาพห้องผ่าน URL (แนะนำใช้ Google Drive หรือ Supabase Storage)

---

## 📄 License

MIT — ใช้งานได้อิสระ
