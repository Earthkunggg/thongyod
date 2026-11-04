import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Copy, RefreshCw, Send } from 'lucide-react'
import { useMyFriendLink, useRegenerateFriendLink } from '@/api/friends'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { QrCodeCard } from '@/components/friends/QrCodeCard'
import { QrScanner } from '@/components/friends/QrScanner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { friendLinkUrl, parseFriendLink } from '@/features/friends/link'
import { lineShareUrl } from '@/lib/share'
import { showErrorToast, toastManager } from '@/lib/toast'

type Mode = 'mine' | 'scan'

// /friends/qr — show my friend QR (share in LINE, copy, renew) or scan a friend's QR live.
export function FriendQrPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const mode: Mode = params.get('mode') === 'scan' ? 'scan' : 'mine'

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader title={t('friends.addFriend')} backTo="/gangs/friends" />
      <div className="px-3">
        <SegmentedChoice<Mode>
          label={t('friends.qr.modeLabel')}
          value={mode}
          onChange={(m) => setParams(m === 'scan' ? { mode: 'scan' } : {}, { replace: true })}
          options={[
            { value: 'mine', label: t('friends.myQr') },
            { value: 'scan', label: t('friends.scanQr') },
          ]}
        />
      </div>
      {mode === 'mine' ? <MyQr /> : <ScanQr />}
    </div>
  )
}

function MyQr() {
  const { t } = useTranslation()
  const link = useMyFriendLink()
  const regenerate = useRegenerateFriendLink()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (link.isPending) return <LoadingState rows={2} />
  if (link.isError) return <ErrorState onRetry={() => void link.refetch()} />

  const url = friendLinkUrl(link.data.code)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toastManager.add({ title: t('friends.toast.linkCopied') })
    } catch {
      showErrorToast(t('common.saveError'))
    }
  }

  function renew() {
    setConfirmOpen(false)
    regenerate.mutate(undefined, {
      onSuccess: () => toastManager.add({ title: t('friends.toast.linkRenewed') }),
      onError: () => showErrorToast(t('common.saveError')),
    })
  }

  return (
    <div className="flex flex-col gap-4 px-3">
      <QrCodeCard value={url} label={t('friends.myQr')} />
      <p className="text-center text-sm text-muted-foreground">{t('friends.qr.hint')}</p>
      <div className="grid grid-cols-2 gap-2">
        <a href={lineShareUrl(t('friends.qr.shareText', { url }))} target="_blank" rel="noreferrer" className={buttonVariants()}>
          <Send aria-hidden="true" />
          {t('friends.qr.shareLine')}
        </a>
        <Button variant="outline" onClick={() => void copy()}>
          <Copy aria-hidden="true" />
          {t('friends.qr.copy')}
        </Button>
      </div>
      <Button variant="ghost" className="text-muted-foreground" onClick={() => setConfirmOpen(true)} disabled={regenerate.isPending}>
        <RefreshCw aria-hidden="true" />
        {t('friends.qr.renew')}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent title={t('friends.qr.renew')} description={t('friends.qr.renewText')}>
          <div className="grid grid-cols-2 gap-2">
            <DialogClose className={buttonVariants({ variant: 'outline' })}>{t('common.cancel')}</DialogClose>
            <Button onClick={renew}>{t('friends.qr.renewConfirm')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScanQr() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [wrongQr, setWrongQr] = useState(false)

  // Valid friend link → open it at once. Anything else → short notice, keep scanning.
  const onRead = useCallback(
    (text: string) => {
      const code = parseFriendLink(text)
      if (!code) {
        setWrongQr(true)
        return false
      }
      void navigate(`/add/${encodeURIComponent(code)}`)
      return true
    },
    [navigate],
  )

  return (
    <div className="flex flex-col gap-3 px-3">
      <QrScanner onRead={onRead} />
      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        {wrongQr ? t('friends.qr.notOurQr') : t('friends.qr.scanHint')}
      </p>
    </div>
  )
}
