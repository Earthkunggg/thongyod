import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, QrCode, Send, Share2, UserPlus } from 'lucide-react'
import { QrCodeCard } from '@/components/friends/QrCodeCard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { showErrorToast, toastManager } from '@/lib/toast'
import { InviteFriendsSheet } from './InviteFriendsSheet'
import { roomUrl } from './url'

// Every way to bring friends in: big room code, QR, share/copy link, invite from my friends list.
export function RoomShare({ code, exclude }: { code: string; exclude: string[] }) {
  const { t } = useTranslation()
  const [qr, setQr] = useState(false)
  const [invite, setInvite] = useState(false)
  const url = roomUrl(code)

  async function share() {
    const text = t('rooms.shareText', { code })
    try {
      if (navigator.share) await navigator.share({ title: t('rooms.shareTitle'), text, url })
      else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        toastManager.add({ title: t('rooms.linkCopied') })
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      showErrorToast(t('common.saveError'))
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      toastManager.add({ title: t('rooms.codeCopied') })
    } catch {
      showErrorToast(t('common.saveError'))
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border bg-card p-4" aria-label={t('rooms.inviteTitle')}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t('rooms.codeLabel')}</span>
        <Button variant="ghost" size="sm" onClick={() => void copyCode()}>
          <Copy data-icon="inline-start" />
          {t('rooms.copy')}
        </Button>
      </div>
      <div className="flex justify-center gap-1.5" aria-label={t('rooms.codeAria', { code: code.split('').join(' ') })} role="text">
        {code.split('').map((d, i) => (
          <span key={i} aria-hidden="true" className="grid h-14 w-11 place-items-center rounded-xl bg-muted text-3xl font-medium tabular-nums">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => setInvite(true)}>
          <UserPlus />
          <span className="text-xs">{t('rooms.fromFriends')}</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => setQr(true)}>
          <QrCode />
          <span className="text-xs">{t('rooms.showQr')}</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => void share()}>
          {typeof navigator !== 'undefined' && 'share' in navigator ? <Share2 /> : <Send />}
          <span className="text-xs">{t('rooms.shareLink')}</span>
        </Button>
      </div>
      <Dialog open={qr} onOpenChange={setQr}>
        <DialogContent title={t('rooms.qrTitle')} description={t('rooms.qrHint')} className="items-center text-center">
          <QrCodeCard value={url} label={t('rooms.qrTitle')} />
          <span className="text-2xl font-medium tracking-widest tabular-nums">{code}</span>
        </DialogContent>
      </Dialog>
      <InviteFriendsSheet code={code} open={invite} onOpenChange={setInvite} exclude={exclude} />
    </section>
  )
}
