import { useEffect, useRef, useState } from 'react'
import { createShakeDetector } from './logic'

export type ShakeSupport = 'unsupported' | 'needs-permission' | 'on' | 'denied'

type MotionWithPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

function initialSupport(): ShakeSupport {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window) || !window.isSecureContext) return 'unsupported'
  // iOS asks first, and only from a tap (UX_GUIDELINES §4).
  return typeof (DeviceMotionEvent as MotionWithPermission).requestPermission === 'function' ? 'needs-permission' : 'on'
}

/** Calls `onShake` when the phone is shaken. The on-screen button is always the fallback. */
export function useShake(onShake: () => void, enabled: boolean) {
  const [support, setSupport] = useState<ShakeSupport>(initialSupport)
  const handler = useRef(onShake)

  useEffect(() => {
    handler.current = onShake
  })

  useEffect(() => {
    if (support !== 'on' || !enabled) return
    const feed = createShakeDetector()
    const listener = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (a?.x == null || a.y == null || a.z == null) return
      if (feed(a.x, a.y, a.z, e.timeStamp)) handler.current()
    }
    window.addEventListener('devicemotion', listener)
    return () => window.removeEventListener('devicemotion', listener)
  }, [support, enabled])

  /** Must run inside a tap handler on iOS. */
  async function requestPermission() {
    try {
      const result = await (DeviceMotionEvent as MotionWithPermission).requestPermission?.()
      setSupport(result === 'granted' ? 'on' : 'denied')
    } catch {
      setSupport('denied')
    }
  }

  return { support, requestPermission }
}
