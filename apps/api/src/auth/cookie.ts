import { createHash } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { secureCookie } from './policy.js'

export const SESSION_COOKIE = 'thongyod_session'
export const SESSION_SECONDS = 30 * 24 * 60 * 60
export function sessionHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function readSessionCookie(request: IncomingMessage): string | null {
  const values = (request.headers.cookie ?? '').split(';').map(part => part.trim())
    .filter(part => part.startsWith(`${SESSION_COOKIE}=`))
  if (values.length !== 1) return null
  const token = values[0].slice(SESSION_COOKIE.length + 1)
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null
}

export function sessionCookie(token: string, expiresAt: Date): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}; Expires=${expiresAt.toUTCString()}${secureCookie() ? '; Secure' : ''}`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureCookie() ? '; Secure' : ''}`
}
