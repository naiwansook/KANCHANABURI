# Resort Manager Pro — Next.js + Supabase

## โครงสร้างไฟล์
```
resort-manager/
├── pages/
│   ├── _app.jsx          # App wrapper
│   ├── index.jsx         # หน้าหลัก (ระบบจัดการ)
│   ├── booking.jsx       # หน้าจองออนไลน์ (public)
│   └── api/
│       └── [fn].js       # API routes ทั้งหมด (แทน code.gs)
├── lib/
│   └── supabase.js       # Supabase client
├── .env.local.example    # ตัวอย่าง env
├── next.config.js
└── package.json
```

## วิธีติดตั้งและรัน

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า environment variables
สร้างไฟล์ `.env.local` แล้วใส่ค่าจาก Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. รันบนเครื่อง
```bash
npm run dev
```
เปิด http://localhost:3000

## Deploy บน Vercel

### วิธีที่ 1: ผ่าน GitHub (แนะนำ)
1. Push โค้ดขึ้น GitHub
2. ไปที่ vercel.com → Import Project → เลือก repo
3. เพิ่ม Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. กด Deploy

### วิธีที่ 2: Vercel CLI
```bash
npm i -g vercel
vercel
```

## การเชื่อมต่อ Supabase

ตรวจสอบว่า column names ใน Supabase ตรงกับที่ใช้ใน API:

| Table | Columns สำคัญ |
|---|---|
| Rooms | ID, Name, PricePerNight, Status, ImageURLs |
| Bookings | ID, CustomerName, RoomID, CheckIn, CheckOut, Status |
| Transactions | ID, Date, Category, Type, Amount |
| Categories | ID, Name, Type, Color |
| Budgets | MonthYear, CategoryID, Name, Amount |
| UserLogin | id, Username, Password, Role, DisplayName |
| User | id, Name, Image |

## หน้าเว็บ
- `/` — ระบบจัดการ (ต้อง login)
- `/booking` — หน้าจองออนไลน์ (public)
