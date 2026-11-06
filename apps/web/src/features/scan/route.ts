// One QR scanner for the whole app (decision #82): whatever page it is opened from,
// a scanned QR goes where it belongs — friend link → add friend, room → room, meetup → meetup.
import { roomCodeFrom } from '@/api/rooms'
import { parseFriendLink } from '@/features/friends/link'

export type ScanTarget =
  | { kind: 'friend' | 'room' | 'meetup' | 'page'; to: string }
  /** A Thai QR payment code (PromptPay / bank). We can't pay from the app, so we say so. */
  | { kind: 'payment' }
  /** Not ours (another website, plain text, a different app). */
  | { kind: 'unknown' }

/** Thai QR payment: EMVCo payload ("000201…") with the Thai QR AID (A000000677…). */
const isThaiPaymentQr = (text: string) => /^000201/.test(text) && text.includes('A000000677')

/** "/meetups/m1?x=1" from our two link shapes: <origin>/path (local/real) and <origin><base>#/path (demo). */
function appPath(url: URL, base: string): string | null {
  if (url.hash.startsWith('#/')) return url.hash.slice(1)
  return (url.pathname === '/' || url.pathname === base) && !url.search ? null : `${url.pathname}${url.search}`
}

/**
 * Where a scanned QR should take the user. Friend, room and meetup links are accepted from any origin
 * (a QR made on another device or on the demo site) because only the code/id is used. Any other page
 * is opened only when the link is clearly ours: same origin, or a "#/" link under our base path (demo site).
 */
export function scanTarget(raw: string, ourOrigin: string, base = '/'): ScanTarget {
  const text = raw.trim()
  if (!text) return { kind: 'unknown' }

  const friend = parseFriendLink(text)
  if (friend) return { kind: 'friend', to: `/add/${encodeURIComponent(friend)}` }

  const room = roomCodeFrom(text)
  if (room) return { kind: 'room', to: `/games/rooms/${room}` }

  if (isThaiPaymentQr(text)) return { kind: 'payment' }

  let url: URL
  try {
    url = new URL(text)
  } catch {
    return { kind: 'unknown' }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { kind: 'unknown' }
  const path = appPath(url, base)
  if (!path) return url.origin === ourOrigin ? { kind: 'page', to: '/' } : { kind: 'unknown' }

  const meetup = path.match(/^\/meetups\/([A-Za-z0-9_-]{1,64})\/?$/)
  if (meetup && meetup[1] !== 'new') return { kind: 'meetup', to: `/meetups/${meetup[1]}` }

  const ours = url.origin === ourOrigin || (url.hash.startsWith('#/') && url.pathname === base)
  return ours ? { kind: 'page', to: path } : { kind: 'unknown' }
}
