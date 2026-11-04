import { appUrl } from '@/lib/share'

// Friend links look like <origin>/add/<code>. The QR code contains the same URL.

export function friendLinkUrl(code: string): string {
  return appUrl(`/add/${encodeURIComponent(code)}`)
}

/**
 * Gets the code from a scanned QR text. Accepts any origin (e.g. a QR made on another device)
 * because only the code is used, inside our own app. Returns null for anything else.
 */
export function parseFriendLink(text: string): string | null {
  try {
    const match = new URL(text).pathname.match(/^\/add\/([A-Za-z0-9_-]{4,64})\/?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
