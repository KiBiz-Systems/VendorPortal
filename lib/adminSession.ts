import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

export const ADMIN_SESSION_COOKIE = "admin_session"
const SESSION_TTL_SECONDS = 8 * 60 * 60 // 8 hours

type AdminSessionPayload = {
  role: "admin"
  exp: number
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET in environment.")
  }
  return secret
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

export function createAdminSessionToken(): string {
  const payload: AdminSessionPayload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) {
    return false
  }

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    return false
  }

  const expectedSignature = sign(encodedPayload)
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return false
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AdminSessionPayload
    return payload.role === "admin" && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

/** Used by admin API route handlers and the admin layout to gate access. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
}
