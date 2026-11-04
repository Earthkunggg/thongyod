// Sharing to LINE and other apps.

/** LINE share screen (works in LINE for iOS/Android; see developers.line.biz "LINE URL scheme"). */
export function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`
}

/** Full URL of an app page, e.g. appUrl('/meetups/m1'). */
export function appUrl(path: string): string {
  return `${window.location.origin}${path}`
}
