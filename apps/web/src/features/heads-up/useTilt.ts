import { useEffect, useRef, useState } from 'react'

export type TiltSupport = 'unsupported' | 'needs-permission' | 'on' | 'denied'

type MotionWithPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

/** No sensor event for this long while playing = sensor stuck (known iOS issue) → fall back to taps. */
export const WATCHDOG_MS = 1500

export function tiltSupport(): TiltSupport {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window) || !window.isSecureContext) return 'unsupported'
  return typeof (DeviceMotionEvent as MotionWithPermission).requestPermission === 'function' ? 'needs-permission' : 'on'
}

/** Must run inside a tap handler on iOS (UX_GUIDELINES §4). Resolves to the new support state. */
export async function requestTiltPermission(): Promise<TiltSupport> {
  try {
    const result = await (DeviceMotionEvent as MotionWithPermission).requestPermission?.()
    return result === 'granted' ? 'on' : 'denied'
  } catch {
    return 'denied'
  }
}

/**
 * Streams z (gravity along the screen normal) to `onZ` while `active`.
 * `stuck` turns true when no event arrives for WATCHDOG_MS; listening then stops and the game uses taps only.
 */
export function useTiltStream(active: boolean, onZ: (z: number, t: number) => void) {
  const handler = useRef(onZ)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    handler.current = onZ
  })

  useEffect(() => {
    if (!active || stuck) return
    let last = performance.now()
    const listener = (e: DeviceMotionEvent) => {
      const z = e.accelerationIncludingGravity?.z
      if (z == null) return
      last = performance.now()
      handler.current(z, last)
    }
    window.addEventListener('devicemotion', listener)
    const timer = window.setInterval(() => {
      if (performance.now() - last > WATCHDOG_MS) setStuck(true)
    }, 500)
    return () => {
      window.removeEventListener('devicemotion', listener)
      window.clearInterval(timer)
    }
  }, [active, stuck])

  return stuck
}

/** Keeps the screen on during a round where the browser supports it (Screen Wake Lock API). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    navigator.wakeLock
      .request('screen')
      .then((l) => {
        if (cancelled) void l.release()
        else lock = l
      })
      .catch(() => undefined) // Not allowed (battery saver, iframe…): the game still works.
    return () => {
      cancelled = true
      void lock?.release()
    }
  }, [active])
}

/** Fullscreen + landscape lock where possible (Chrome Android). iPhone ignores both; the game asks to rotate instead. */
export async function enterLandscape(): Promise<void> {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    await orientation.lock?.('landscape')
  } catch {
    // Not supported: fine.
  }
}

export function leaveLandscape(): void {
  try {
    screen.orientation?.unlock?.()
    if (document.fullscreenElement) void document.exitFullscreen()
  } catch {
    // Ignore.
  }
}
