import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('budgets').select('*').order('month_year')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by month_year
  const result: Record<string, Array<{ category_name: string; amount: number }>> = {}
  ;(data || []).forEach((b: { month_year: string; category_name: string; amount: number }) => {
    if (!result[b.month_year]) result[b.month_year] = []
    result[b.month_year].push({ category_name: b.category_name, amount: b.amount })
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  try {
    const { month_year, budgets } = await req.json()
    // Delete existing for this month
    await supabaseAdmin.from('budgets').delete().eq('month_year', month_year)
    // Insert new
    if (budgets && budgets.length > 0) {
      const rows = budgets.map((b: { category_name: string; amount: number }) => ({
        month_year,
        category_name: b.category_name,
        amount: b.amount,
      }))
      const { error } = await supabaseAdmin.from('budgets').insert(rows)
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
