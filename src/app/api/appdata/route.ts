import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const [rooms, bookings, transactions, categories, budgets, profile, users] = await Promise.all([
      supabaseAdmin.from('rooms').select('*').order('id'),
      supabaseAdmin.from('bookings').select('*').order('id', { ascending: false }),
      supabaseAdmin.from('transactions').select('*').order('date', { ascending: false }),
      supabaseAdmin.from('categories').select('*').order('id'),
      supabaseAdmin.from('budgets').select('*').order('month_year'),
      supabaseAdmin.from('resort_profile').select('*').single(),
      supabaseAdmin.from('user_logins').select('id, username, role, display_name, permissions').order('id'),
    ])

    // Group budgets by month_year
    const budgetMap: Record<string, Array<{ category_name: string; amount: number }>> = {}
    ;(budgets.data || []).forEach((b: { month_year: string; category_name: string; amount: number }) => {
      if (!budgetMap[b.month_year]) budgetMap[b.month_year] = []
      budgetMap[b.month_year].push({ category_name: b.category_name, amount: b.amount })
    })

    return NextResponse.json({
      rooms: rooms.data || [],
      bookings: bookings.data || [],
      transactions: transactions.data || [],
      categories: categories.data || [],
      budgets: budgetMap,
      profile: profile.data || { name: 'Resort Manager', image_url: '' },
      users: users.data || [],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
