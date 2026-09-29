import { NextResponse } from 'next/server'
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/adminSession'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid credentials. Email and password are required.' },
        { status: 400 }
      )
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new Error('Missing admin credentials in environment.')
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    const response = NextResponse.json(
      { success: true, admin: { email: adminEmail } },
      { status: 200 }
    )

    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 60 * 60,
    })

    return response
  } catch (error: unknown) {
    console.error('Admin Auth API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Malformed request body or server error' },
      { status: 500 }
    )
  }
}
