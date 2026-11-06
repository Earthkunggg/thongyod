import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { QrScanner } from '@/components/scan/QrScanner'
import { scanTarget } from '@/features/scan/route'

type Props = {
  /** Called right before we leave for the scanned page (e.g. close the dialog it lives in). */
  onDone?: () => void
}

// The one QR scanner (decision #82): friend → add friend, room → room, meetup → meetup, our page → that page.
// Payment QRs and QRs that are not ours show a short line and keep scanning.
export function AppScanner({ onDone }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState<'payment' | 'unknown' | null>(null)

  const onRead = useCallback(
    (text: string) => {
      const target = scanTarget(text, window.location.origin, import.meta.env.BASE_URL)
      if (target.kind === 'payment' || target.kind === 'unknown') {
        setNotice(target.kind)
        return false
      }
      onDone?.()
      void navigate(target.to)
      return true
    },
    [navigate, onDone],
  )

  return (
    <div className="flex flex-col gap-3">
      <QrScanner onRead={onRead} />
      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        {notice ? t(`scan.${notice}`) : t('scan.hint')}
      </p>
    </div>
  )
}
