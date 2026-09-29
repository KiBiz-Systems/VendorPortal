import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminSession'
import { getCompanyProfile } from '@/services/filemakerService'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const company = await getCompanyProfile()
    return NextResponse.json(
      {
        success: true,
        admin: { email: process.env.ADMIN_EMAIL || '' },
        company,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Admin Profile API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch company profile' },
      { status: 500 }
    )
  }
}
