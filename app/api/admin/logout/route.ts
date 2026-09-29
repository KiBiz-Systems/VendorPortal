import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/adminSession'

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
