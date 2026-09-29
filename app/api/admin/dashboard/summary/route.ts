import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminSession'
import { getAdminDashboardSummary } from '@/services/filemakerService'

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    const summary = await getAdminDashboardSummary({ from, to })
    return NextResponse.json({ success: true, summary }, { status: 200 })
  } catch (error: unknown) {
    console.error('Admin Dashboard Summary API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary' },
      { status: 500 }
    )
  }
}
