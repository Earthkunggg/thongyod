import { appUrl } from '@/lib/share'

// Local links use /add/<code>; static demo links use <base>/#/add/<code>.

export function friendLinkUrl(code: string): string {
  return appUrl(`/add/${encodeURIComponent(code)}`)
}

/**
 * Gets the code from a scanned QR text. Accepts any origin (e.g. a QR made on another device)
 * because only the code is used, inside our own app. Returns null for anything else.
 */
export function parseFriendLink(text: string): string | null {
  try {
    const url = new URL(text)
    const path = url.hash.startsWith('#/') ? url.hash.slice(1).split('?')[0] : url.pathname
    const match = path.match(/^\/add\/([A-Za-z0-9_-]{4,64})\/?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
