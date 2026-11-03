import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QrScannerLib from 'qr-scanner'
import { CameraOff } from 'lucide-react'

type QrScannerProps = {
  /** Called for every QR text read. Return true to stop scanning (e.g. a valid friend link). */
  onRead: (text: string) => boolean
}

type ScanState = 'starting' | 'scanning' | 'failed'

// Live camera QR reader: reads as soon as a QR is in view, no shutter button (decision #34).
// Library: qr-scanner (MIT). Camera works only on https or localhost.
export function QrScanner({ onRead }: QrScannerProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const onReadRef = useRef(onRead)
  const [state, setState] = useState<ScanState>('starting')

  useEffect(() => {
    onReadRef.current = onRead
  }, [onRead])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const scanner = new QrScannerLib(
      video,
      (result) => {
        if (onReadRef.current(result.data)) scanner.stop()
      },
      { preferredCamera: 'environment', maxScansPerSecond: 8, returnDetailedScanResult: true },
    )
    scanner
      .start()
      .then(() => setState('scanning'))
      // qr-scanner reports permission denied and no camera the same way, so one message covers both.
      .catch(() => setState('failed'))
    return () => scanner.destroy()
  }, [])

  const failed = state === 'failed'
  return (
    <div className="relative mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="size-full object-cover" muted playsInline aria-label={t('friends.qr.scanHint')} />
      {!failed && (
        // Frame guide in the middle of the camera view.
        <div aria-hidden="true" className="pointer-events-none absolute inset-10 rounded-xl border-2 border-white/80" />
      )}
      {failed && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white">
          <CameraOff className="size-8" aria-hidden="true" />
          <p className="text-sm font-medium">{t('friends.qr.cameraFailed')}</p>
          <p className="text-xs opacity-80">{t('friends.qr.cameraFailedHint')}</p>
        </div>
      )}
    </div>
  )
}
