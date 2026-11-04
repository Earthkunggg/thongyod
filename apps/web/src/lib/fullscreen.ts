// Fullscreen that also works on iPad Safari (webkit-prefixed API on older iPadOS). iPhone Safari has no
// element fullscreen at all, so `supported` is false there and games simply use the whole page.
import { useCallback, useSyncExternalStore } from 'react'

type WebkitDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void; webkitFullscreenEnabled?: boolean }
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

const doc = () => document as WebkitDocument

export function fullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false
  return Boolean(document.fullscreenEnabled || doc().webkitFullscreenEnabled)
}

export function isFullscreen(): boolean {
  return typeof document !== 'undefined' && Boolean(document.fullscreenElement || doc().webkitFullscreenElement)
}

/** Must be called from a tap. Never throws (some browsers refuse without telling why). */
export async function enterFullscreen(element: HTMLElement = document.documentElement): Promise<void> {
  try {
    const el = element as WebkitElement
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
    else await el.webkitRequestFullscreen?.()
  } catch {
    // Refused (not from a tap, or not allowed): the page still fills the screen.
  }
}

export async function exitFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (doc().webkitFullscreenElement) await doc().webkitExitFullscreen?.()
  } catch {
    // Ignore.
  }
}

function subscribe(listener: () => void) {
  document.addEventListener('fullscreenchange', listener)
  document.addEventListener('webkitfullscreenchange', listener)
  return () => {
    document.removeEventListener('fullscreenchange', listener)
    document.removeEventListener('webkitfullscreenchange', listener)
  }
}

/** Live fullscreen state + actions. `active` updates when the user leaves with the browser's ✕ or Esc. */
export function useFullscreen() {
  const active = useSyncExternalStore(subscribe, isFullscreen, () => false)
  const enter = useCallback(() => enterFullscreen(), [])
  return { supported: fullscreenSupported(), active, enter, exit: exitFullscreen }
}
